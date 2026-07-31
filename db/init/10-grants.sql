-- ============================================================
-- HELIARA - Octroi des privilèges d'exécution
--
-- **Le seul endroit qui décide de ce que chaque compte applicatif peut appeler.**
-- À lire comme la frontière du système : ce qui n'y figure pas est inatteignable.
--
-- Le privilège est accordé **procédure par procédure**, jamais au niveau du schéma
-- (`GRANT EXECUTE ON heliara.*`). La différence est décisive : avec un grant de
-- schéma, toute procédure écrite ensuite devient immédiatement appelable par le
-- site public, sans que personne l'ait voulu. Ici, une procédure oubliée provoque
-- une erreur bruyante au premier appel - un défaut qui se voit, et non une fuite
-- qui ne se voit pas.
--
-- Règle de nommage à respecter : **une procédure `pub_*` ne fait que lire, et ne
-- rend que du contenu publié.** C'est ce qui rend cette page vérifiable d'un coup
-- d'œil.
--
-- Ce fichier doit être rejoué après tout ajout de procédure.
-- ============================================================

-- ------------------------------------------------------------
-- app_read : le site public
-- ------------------------------------------------------------
-- Remise à plat avant de réattribuer : rejouer ce fichier ne doit jamais laisser
-- un privilège accordé par une version antérieure.
--
-- La forme `REVOKE ALL PRIVILEGES, GRANT OPTION FROM` est la seule qui emporte
-- aussi les privilèges de routine : ceux-ci vivent dans `mysql.procs_priv`, et un
-- `REVOKE ALL ON heliara.*` ne les toucherait pas. Elle est de surcroît
-- idempotente sur un compte qui n'a encore rien, là où la forme par objet
-- échouerait en 1141.
--
-- **Ce fichier demande `root` ou un compte porteur de `GRANT OPTION`.** Sur volume
-- vierge, `db/init` tourne en root, donc il passe seul ; rejoué à la main, il ne
-- passe pas en `db_migrate`, qui n'a pas ce privilège - et ne doit pas l'avoir.
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'app_read'@'%';

GRANT EXECUTE ON PROCEDURE heliara.pub_list_case_studies TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_get_case_study     TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_case_slugs    TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_case_sectors  TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_articles      TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_get_article        TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_article_slugs TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_client_references TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_team_members TO 'app_read'@'%';

-- **La seule procédure d'écriture accordée au site public.** Elle ne peut
-- qu'incrémenter deux compteurs, ne rend aucune ligne et n'accepte qu'un slug : le
-- pire qu'un appelant hostile en tire est un chiffre gonflé. C'est le seul
-- millimètre de surface d'écriture ouvert, et il l'est parce que les privilèges
-- sont accordés procédure par procédure - un `GRANT EXECUTE ON heliara.*` aurait
-- tout ouvert d'un coup.
GRANT EXECUTE ON PROCEDURE heliara.pub_count_article_view TO 'app_read'@'%';

GRANT EXECUTE ON PROCEDURE heliara.pub_list_expertise_families TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_expertise_services TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_get_expertise_service   TO 'app_read'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_expertise_slugs    TO 'app_read'@'%';

-- Les fonctions utilitaires sont sans effet de bord et ne touchent aucune table.
GRANT EXECUTE ON FUNCTION heliara.Bin2Uuid TO 'app_read'@'%';
GRANT EXECUTE ON FUNCTION heliara.Uuid2Bin TO 'app_read'@'%';

-- ------------------------------------------------------------
-- app_write : l'administration
-- ------------------------------------------------------------
-- Elle a besoin de tout, lecture comprise : ses écrans affichent les brouillons.
-- Le grant reste explicite plutôt que fait au niveau du schéma, pour la même
-- raison que ci-dessus - et parce que la liste sert de recensement.
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'app_write'@'%';

-- Authentification et comptes.
GRANT EXECUTE ON PROCEDURE heliara.create_user           TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.get_user              TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.get_user_for_login    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.list_users            TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_user_password     TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_user_suspended    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_user           TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.create_password_reset TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.reset_password        TO 'app_write'@'%';

-- Sessions.
GRANT EXECUTE ON PROCEDURE heliara.create_session       TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.get_session          TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.touch_session        TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_session       TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_user_sessions TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.purge_sessions       TO 'app_write'@'%';

-- Journal d'audit. `write_audit` n'est pas accordée : elle n'est appelée que
-- depuis une autre procédure, qui s'exécute avec les droits de son définisseur.
GRANT EXECUTE ON PROCEDURE heliara.list_audit TO 'app_write'@'%';

-- Réalisations.
GRANT EXECUTE ON PROCEDURE heliara.list_case_studies    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.get_case_study_full  TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.list_case_slugs      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.list_case_sectors    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.create_case_study    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.update_case_study    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.publish_case_study   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_case_study    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.reorder_case_studies TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_case_chapters    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_case_results     TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_case_meta        TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_case_lessons     TO 'app_write'@'%';

-- Articles.
GRANT EXECUTE ON PROCEDURE heliara.list_articles         TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.get_article_full      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.create_article        TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.update_article        TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_article_blocks    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.publish_article       TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_article        TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_article_featured  TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.get_article_views     TO 'app_write'@'%';

-- Expertises.
GRANT EXECUTE ON PROCEDURE heliara.list_expertise_families      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.create_expertise_family      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.update_expertise_family      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_expertise_family      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.reorder_expertise_families   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.list_expertise_services      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.get_expertise_service_full   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.create_expertise_service     TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.update_expertise_service     TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.publish_expertise_service    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_expertise_service     TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.reorder_expertise_services   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_expertise_deliverables   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_expertise_tech_choices   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_expertise_faq            TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_expertise_why_custom     TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_expertise_families  TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_expertise_services  TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_get_expertise_service    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_expertise_slugs     TO 'app_write'@'%';

-- Médias. Aucune n'est accordée à `app_read` : le site public lit les images par
-- leur URL publique dans MinIO, il n'a jamais besoin d'interroger la table.
GRANT EXECUTE ON PROCEDURE heliara.create_media       TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.confirm_media      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.get_media          TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.list_media         TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_media_alt      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_media       TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_case_gallery   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.list_case_gallery  TO 'app_write'@'%';

-- L'administration lit aussi la surface publique, pour prévisualiser ce que verra
-- un visiteur, avec exactement la même requête que lui.
GRANT EXECUTE ON PROCEDURE heliara.pub_list_case_studies TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_get_case_study    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_case_slugs   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_case_sectors TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_articles      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_get_article        TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_article_slugs TO 'app_write'@'%';
-- Accordée aussi à l'administration, mais pour une autre raison : ses tests
-- d'intégration exercent le comptage, et l'aperçu peut vouloir le déclencher. Elle
-- ne lui ouvre rien de plus - elle a déjà tous les droits d'écriture.
GRANT EXECUTE ON PROCEDURE heliara.pub_count_article_view TO 'app_write'@'%';

-- Références clientes. Le bandeau « Ils nous font confiance ».
GRANT EXECUTE ON PROCEDURE heliara.list_client_references    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.create_client_reference   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.update_client_reference   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.publish_client_reference  TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.reorder_client_references TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_client_reference   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_client_references TO 'app_write'@'%';

-- L'équipe. Les personnes de /a-propos, dont les associés de /contact.
GRANT EXECUTE ON PROCEDURE heliara.list_team_members     TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.list_team_skills      TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.create_team_member    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.update_team_member    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.set_team_skills       TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.publish_team_member   TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.reorder_team_members  TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.delete_team_member    TO 'app_write'@'%';
GRANT EXECUTE ON PROCEDURE heliara.pub_list_team_members TO 'app_write'@'%';

-- Fonctions utilitaires.
GRANT EXECUTE ON FUNCTION heliara.GenerateKey TO 'app_write'@'%';
GRANT EXECUTE ON FUNCTION heliara.Bin2Uuid    TO 'app_write'@'%';
GRANT EXECUTE ON FUNCTION heliara.Uuid2Bin    TO 'app_write'@'%';
GRANT EXECUTE ON FUNCTION heliara.Slugify     TO 'app_write'@'%';

FLUSH PRIVILEGES;
