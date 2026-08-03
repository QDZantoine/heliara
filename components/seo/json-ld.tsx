/**
 * Un graphe schema.org, posé dans la page.
 *
 * **Server Component, aucun JavaScript envoyé.** Le script porte
 * `type="application/ld+json"` : le navigateur ne l'exécute pas, il ne fait que le
 * mettre à disposition des robots. C'est du contenu, pas du code.
 *
 * `JSON.stringify` échappe les guillemets mais **pas** `</script>`, qui refermerait
 * la balise depuis l'intérieur d'une chaîne : un titre de réalisation contenant cette
 * suite injecterait du balisage. Les deux barres obliques sont donc échappées en
 * `<`, forme que tout analyseur JSON relit à l'identique. C'est le seul
 * traitement, et il est nécessaire - la donnée vient de la base, donc d'une saisie.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
