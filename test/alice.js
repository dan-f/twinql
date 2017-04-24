export default `
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix dbo: <http://dbpedia.org/ontology/Dog> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<#alice> a foaf:Person
  ; foaf:name "Alice"
  ; foaf:knows <https://bob.com/graph#bob>
  ; foaf:knows <#spot>
  ; foaf:age "24"^^xsd:integer
  ; foaf:based_near "Estados Unidos"@es
  .

<#spot> a dbo:Dog
  ; foaf:name "Spot"
  ; foaf:knows <#alice>
  .
`
