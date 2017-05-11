export default `
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix dbo: <http://dbpedia.org/ontology/Dog> .
@prefix pim: <http://www.w3.org/ns/pim/space#> .
@prefix solid: <http://solid.github.io/vocab/solid-terms.ttl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<#alice> a foaf:Person
  ; foaf:name "Alice"
  ; foaf:knows <https://bob.com/graph#bob>
  ; foaf:knows <#spot>
  ; foaf:age "24"^^xsd:integer
  ; foaf:based_near "Estados Unidos"@es
  ; pim:storage <https://alice.com/storageSpace/>
  ; solid:publicTypeIndex <https://alice.com/Preferences/publicTypeIndex.ttl>
  .

<#spot> a dbo:Dog
  ; foaf:name "Spot"
  ; foaf:knows <#alice>
  .
`
