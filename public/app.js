const edit = ace.edit('editor')
edit.session.setTabSize(2)
edit.setFontSize(14)
edit.setBehavioursEnabled(true)
edit.setTheme('ace/theme/dawn')

const SERVER_URL = 'https://databox.me/,query'

const queryDictionary = {
  'profile':
`@prefix foaf http://xmlns.com/foaf/0.1/

https://dan-f.databox.me/profile/card#me {
  foaf:name
}
`,
  'social': `@prefix foaf http://xmlns.com/foaf/0.1/

https://dan-f.databox.me/profile/card#me {
  foaf:name
  [ foaf:knows ] {
    foaf:title
    foaf:name
  }
}
`,
  'data-discovery':
`@prefix book  http://www.w3.org/2002/01/bookmark#
@prefix dc    http://purl.org/dc/elements/1.1/
@prefix rdf   http://www.w3.org/1999/02/22-rdf-syntax-ns#
@prefix solid http://solid.github.io/vocab/solid-terms.ttl#

https://dan-f.databox.me/profile/card#me {
  solid:publicTypeIndex => ( rdf:type solid:TypeRegistration
                             solid:forClass book:Bookmark ) {
    solid:instance => ( rdf:type book:Bookmark ) {
      dc:title
      dc:description
      book:recalls
      [ book:hasTopic ]
    }
  }
}
`,
  'error-handling':
`@prefix dc    http://purl.org/dc/terms/
@prefix ldp   http://www.w3.org/ns/ldp#
@prefix rdf   http://www.w3.org/1999/02/22-rdf-syntax-ns#
@prefix sioc  http://rdfs.org/sioc/ns#
@prefix solid http://solid.github.io/vocab/solid-terms.ttl#

https://deiu.me/profile#me {
  solid:publicTypeIndex => ( rdf:type solid:TypeRegistration
                             solid:forClass sioc:Post ) {
    solid:instanceContainer => ( rdf:type ldp:Resource ) {
      dc:title
      sioc:content
    }
  }
}
`
}

const throughAgent = queryText =>
  fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: queryText
  }).then(response => response.json())

const onTheClient = queryText => {
  const backend = new twinql.WebBackend({ proxyUri: 'https://databox.me/,proxy?uri=' })
  return twinql.query(backend, queryText)
}

const responseArea = document.getElementById('response-area')

document.querySelectorAll('.query-example').forEach(exampleLink => {
  exampleLink.addEventListener('click', (event) => {
    event.preventDefault()
    edit.setValue(queryDictionary[event.target.hash.substr(1)])
    edit.clearSelection()
    responseArea.innerText = ''
    responseArea.classList.remove('success', 'error')
  })
})

document.querySelector('#query-agent-uri').addEventListener('click', (event) => {
  event.preventDefault()
  runQuery(throughAgent)
})

document.querySelector('#query-client-side').addEventListener('click', (event) => {
  event.preventDefault()
  runQuery(onTheClient)
})

function runQuery (queryFn) {
  const queryText = edit.getValue()
  responseArea.innerText = ''
  responseArea.classList.remove('success', 'error')
  responseArea.classList.add('loading')
  queryFn(queryText)
    .then(json => {
      responseArea.innerText = JSON.stringify(json, null, 2)
      responseArea.classList.remove('loading', 'error')
      responseArea.classList.add('success')
    })
    .catch(err => {
      responseArea.innerText = err
      responseArea.classList.remove('success', 'loading')
      responseArea.classList.add('error')
      throw err
    })
}
