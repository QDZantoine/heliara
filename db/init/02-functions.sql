-- ============================================================
-- HELIARA - Fonctions utilitaires
--
-- Conversion binaire <-> hexadécimal <-> UUID. Les identifiants circulent en
-- BINARY(16) dans toute l'API SQL : c'est compact, indexable, et agnostique du
-- langage appelant, qui convertit de son côté.
--
-- GenerateKey() produit un UUID version 7 : horodaté en tête, donc trié dans
-- l'ordre de création. Contrairement à UUID() (version 1, dont les octets de
-- poids faible varient en premier), il donne une bonne localité d'insertion sur
-- une clé primaire InnoDB - les nouvelles lignes vont toutes en fin d'index au
-- lieu d'éparpiller les pages.
--
-- Le v7 est assemblé à la main et non délégué à `UUID_v7()`, qui n'existe qu'à
-- partir de MariaDB 11.7 : l'API SQL reste ainsi portable sur n'importe quel
-- hôte 11.x. Seul prérequis, `RANDOM_BYTES()`, présent depuis 11.3.
-- ============================================================

DELIMITER $$

-- GenerateKey : identifiant BINARY(16), UUID v7, trié dans le temps.
--
-- Disposition des 16 octets, conforme à la RFC 9562 :
--   0-5  horodatage en millisecondes, gros-boutiste
--   6    numéro de version (0111) puis 4 bits aléatoires
--   7    8 bits aléatoires
--   8    marqueur de variante (10) puis 6 bits aléatoires
--   9-15 56 bits aléatoires
DROP FUNCTION IF EXISTS GenerateKey$$
CREATE FUNCTION GenerateKey()
RETURNS BINARY(16)
NOT DETERMINISTIC
SQL SECURITY INVOKER
BEGIN
  DECLARE v_ms BIGINT UNSIGNED;
  DECLARE v_rand CHAR(20);

  SET v_ms = FLOOR(UNIX_TIMESTAMP(NOW(3)) * 1000);
  SET v_rand = HEX(RANDOM_BYTES(10));

  RETURN UNHEX(CONCAT(
    LPAD(HEX(v_ms), 12, '0'),
    '7', SUBSTRING(v_rand, 1, 3),
    -- 128 force les deux bits de variante à 10, le masque garde les 6 autres.
    HEX(128 | (CONV(SUBSTRING(v_rand, 4, 2), 16, 10) & 63)),
    SUBSTRING(v_rand, 6, 14)
  ));
END$$

-- Uuid2Bin : UUID canonique (36 caractères) vers BINARY(16).
-- Tolère l'absence de tirets et la casse. Renvoie NULL sur une entrée invalide
-- plutôt que des octets tronqués, pour que l'erreur remonte au lieu de corrompre.
DROP FUNCTION IF EXISTS Uuid2Bin$$
CREATE FUNCTION Uuid2Bin(p_uuid VARCHAR(36))
RETURNS BINARY(16)
DETERMINISTIC
SQL SECURITY INVOKER
BEGIN
  DECLARE v_hex CHAR(32);

  IF p_uuid IS NULL THEN
    RETURN NULL;
  END IF;

  SET v_hex = REPLACE(p_uuid, '-', '');

  IF CHAR_LENGTH(v_hex) <> 32 OR v_hex REGEXP '[^0-9a-fA-F]' THEN
    RETURN NULL;
  END IF;

  RETURN UNHEX(v_hex);
END$$

-- Bin2Uuid : BINARY(16) vers UUID canonique en minuscules.
DROP FUNCTION IF EXISTS Bin2Uuid$$
CREATE FUNCTION Bin2Uuid(p_bin BINARY(16))
RETURNS CHAR(36)
DETERMINISTIC
SQL SECURITY INVOKER
BEGIN
  DECLARE v_hex CHAR(32);

  IF p_bin IS NULL THEN
    RETURN NULL;
  END IF;

  SET v_hex = LOWER(HEX(p_bin));

  RETURN CONCAT(
    SUBSTRING(v_hex, 1, 8), '-',
    SUBSTRING(v_hex, 9, 4), '-',
    SUBSTRING(v_hex, 13, 4), '-',
    SUBSTRING(v_hex, 17, 4), '-',
    SUBSTRING(v_hex, 21, 12)
  );
END$$

-- Slugify : normalise un titre en identifiant d'URL. Utilisé au besoin par les
-- procédures de création, quand l'appelant ne fournit pas de slug.
DROP FUNCTION IF EXISTS Slugify$$
CREATE FUNCTION Slugify(p_text VARCHAR(255))
RETURNS VARCHAR(255)
DETERMINISTIC
SQL SECURITY INVOKER
BEGIN
  DECLARE v_out VARCHAR(255);

  SET v_out = LOWER(TRIM(p_text));
  -- Translittération des diacritiques les plus courants en français.
  SET v_out = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_out,
              'à','a'),'â','a'),'ä','a'),'á','a'),'ã','a');
  SET v_out = REPLACE(REPLACE(REPLACE(REPLACE(v_out,
              'é','e'),'è','e'),'ê','e'),'ë','e');
  SET v_out = REPLACE(REPLACE(REPLACE(REPLACE(v_out,
              'î','i'),'ï','i'),'í','i'),'ì','i');
  SET v_out = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_out,
              'ô','o'),'ö','o'),'ó','o'),'ò','o'),'õ','o');
  SET v_out = REPLACE(REPLACE(REPLACE(REPLACE(v_out,
              'û','u'),'ü','u'),'ú','u'),'ù','u');
  SET v_out = REPLACE(REPLACE(REPLACE(v_out, 'ç','c'), 'ñ','n'), 'œ','oe');
  SET v_out = REPLACE(v_out, 'æ', 'ae');
  -- Tout ce qui n'est ni lettre ni chiffre devient un tiret.
  SET v_out = REGEXP_REPLACE(v_out, '[^a-z0-9]+', '-');
  SET v_out = TRIM(BOTH '-' FROM v_out);

  RETURN v_out;
END$$

DELIMITER ;
