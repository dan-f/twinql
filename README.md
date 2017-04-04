# twinql

A graph query language for the semantic web.  Not [SPARQL](https://www.w3.org/TR/sparql11-query/).


## Use Cases

twinql was designed with the goal of scratching a particular itch: fetching
linked data over [LDP](https://www.w3.org/TR/2015/REC-ldp-20150226/) without
having to imperatively follow every link and handle every error in an ad-hoc
manner in [Solid](https://solid.mit.edu) applications.

The main idea behind twinql is that queries select subgraphs by starting at a
particular node and traversing outwards.  The query and the response have a
similar recursive tree structure so that the shape of the response can be
inferred from the shape of the request.

It is currently a hobby project and quite limited in scope.  It cannot do many
of the things that SPARQL can.  However, it attempts to be more ergonomic than
SPARQL for common use cases.

### Examples
Here's how you would query a WebID for profile data and data of that person's
friends:

```
@prefix foaf http://xmlns.com/foaf/0.1/

https://dan-f.databox.me/profile/card#me {
  foaf.name
  foaf.img
  foaf.knows {
    foaf.name
    foaf.img
  }
}
```
Response:
```js
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/"
  },
  "@id": "https://dan-f.databox.me/profile/card#me",
  "foaf:name": [
    "Daniel Friedman"
  ],
  "foaf:img": [
    "https://dan-f.databox.me/profile/me.jpg"
  ],
  "foaf:knows": [
    {
      "@id": "https://deiu.me/profile#me",
      "foaf:name": [
        "Andrei Vlad Sambra"
      ],
      "foaf:img": [
        "https://deiu.me/avatar.jpg"
      ]
    },
    {
      /* ... */
    }
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

- add tests once design has settled down
- implement on the server (possibly using a delegted agent)
- implement ordering and pagination

### Other cool things

- Use an immutable indexed graph data structure for tracking and intersecting
  the results of various queries
- Create higher level tooling for offline-first querying and realtime updates
- Create bindings for common UI libraries
  - e.g. connected React component
- Mutation API

## Development

This reference implementation of twinql happens to be built in JS for quick
prototyping, but a safer language is recommended when implementing on a server
or for a production use case.

## Contributing

If you want to contribute to this reference implementation, first reach out by creating a Github Issue to make sure we're on the same page :smile:

Assuming you want to mess with the code, just do the following:

0) Make sure you have node >=7.x and npm installed.

1) Clone the repo

```bash
$ git clone https://github.com/dan-f/twinql.git # (or your fork)
```

2) Install the dependencies

```bash
$ cd twinql && npm install
```

3) Run the demo site

```bash
$ npm start
```

4) Build the lib

```bash
# You can run webpack in watch mode to rebuild the UMD bundle on file changes.  This is useful when prototyping with the demo site.
$ npm run build:dev

# To test the minified UMD build:
$ npm run build:umd

# To transpile the library to CommonJS ES5
$ npm run build:lib
```
