# twinql

A graph query language for the semantic web.  Not [SPARQL](https://www.w3.org/TR/sparql11-query/).


## Use Cases and Examples

(Run `npm start` to launch the demo playground and test out more examples.)

Query a WebID profile:

```
@prefix foaf http://xmlns.com/foaf/0.1/

https://dan-f.databox.me/profile/card#me {
  foaf.name
}
```
Response:
```json
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/"
  },
  "@id": "https://dan-f.databox.me/profile/card#me",
  "foaf:name": [
    "Dan"
  ]
}
```


## Goals

- Be declarative
- Work well with existing standards and tools
- Make app-building easier
- Support multiple persistence layers (in-memory, LDP, SPARQL, etc)
- Be implemented eventually on the server to improve performance when querying
  within a single domain and to reduce data being sent over the network


## Known Challenges

- Link-following is slow
- Not all linked data actually links as well as it should
- LDP doesn't care how much data you want from a particular graph; it gives you
  the whole thing
- Just about no operation on the semantic web is atomic


## Roadmap

- M0: add tests once design has settled down
- M1: implement on the server (possibly using a delegted agent)

### Other cool things

- Use an immutable indexed graph data structure for tracking and intersecting
  the results of various queries
- Create higher level tooling for offline-first querying and realtime updates
- Create bindings for common UI libraries
  - e.g. connected React component
- Mutation API

