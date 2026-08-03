-- ============================================================
-- HELIARA - Journal d'audit
--
-- Une seule procédure, appelée par toutes les autres. Elle est volontairement
-- tolérante sur ses paramètres facultatifs : une écriture métier ne doit jamais
-- échouer parce que son adresse IP est inconnue.
--
-- **`SQL SECURITY DEFINER` sur toutes les procédures, et c'est ce qui rend le
-- modèle possible.** Une procédure s'exécute alors avec les droits de son
-- créateur, `db_migrate`, et non avec ceux de l'appelant. C'est la seule façon
-- pour `app_exec`, qui ne dispose que d'`EXECUTE` et d'aucun droit de table, de
-- lire ou d'écrire quoi que ce soit. En `INVOKER`, chaque appel échouerait sur un
-- « SELECT command denied ». Aucune clause `DEFINER = ...` explicite : le
-- créateur courant fait office de définisseur, ce qui évite d'avoir besoin du
-- privilège `SET USER`.
--
-- Elle n'ouvre pas de transaction : elle est toujours appelée depuis une
-- procédure qui en tient une, si bien que la trace est validée avec l'écriture
-- qu'elle décrit, ou annulée avec elle.
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS write_audit$$
CREATE PROCEDURE write_audit(
  IN p_actor_id      BINARY(16),
  IN p_action        VARCHAR(80),
  IN p_resource_type VARCHAR(60),
  IN p_resource_id   BINARY(16),
  IN p_old_value     LONGTEXT,
  IN p_new_value     LONGTEXT,
  IN p_ip            VARCHAR(45)
)
SQL SECURITY DEFINER
BEGIN
  INSERT INTO audit_log (
    id, actor_id, action, resource_type, resource_id,
    old_value, new_value, ip, created_at
  ) VALUES (
    GenerateKey(), p_actor_id, p_action, p_resource_type, p_resource_id,
    p_old_value, p_new_value, p_ip, UNIX_TIMESTAMP()
  );
END$$

/**
 * Journal d'un acteur ou d'une ressource, du plus récent au plus ancien.
 * Les deux filtres sont facultatifs : à NULL, ils ne restreignent rien.
 */
DROP PROCEDURE IF EXISTS list_audit$$
CREATE PROCEDURE list_audit(
  IN p_resource_type VARCHAR(60),
  IN p_resource_id   BINARY(16),
  IN p_limit         INT,
  IN p_offset        INT
)
SQL SECURITY DEFINER
BEGIN
  -- `LIMIT` n'accepte qu'un littéral ou une variable, jamais une expression :
  -- les valeurs par défaut se calculent donc avant.
  DECLARE v_limit  INT;
  DECLARE v_offset INT;

  SET v_limit = LEAST(GREATEST(IFNULL(p_limit, 50), 1), 200);
  SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);

  SELECT
    a.id,
    a.actor_id,
    u.display_name AS actor_name,
    u.email        AS actor_email,
    a.action,
    a.resource_type,
    a.resource_id,
    a.old_value,
    a.new_value,
    a.ip,
    a.created_at
  FROM audit_log a
  LEFT JOIN `user` u ON u.id = a.actor_id
  WHERE (p_resource_type IS NULL OR a.resource_type = p_resource_type)
    AND (p_resource_id IS NULL OR a.resource_id = p_resource_id)
  ORDER BY a.created_at DESC, a.id DESC
  LIMIT v_limit OFFSET v_offset;
END$$

DELIMITER ;
