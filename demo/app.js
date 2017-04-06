const edit = ace.edit('editor')
edit.session.setTabSize(2)
edit.setFontSize(14)
edit.setBehavioursEnabled(true)
edit.setTheme('ace/theme/solarized_light')

const backend = new twinql.LdpBackend()

runQuery()

document.querySelector('#execute-query').addEventListener('click', (event) => {
  event.preventDefault()
  runQuery()
})

function runQuery () {
  const queryText = edit.getValue()
  if (!queryText.trim()) { return }
  const responseArea = document.getElementById('response-area')
  responseArea.classList.remove('success', 'error')
  responseArea.classList.add('loading')
  twinql.query(backend, queryText)
    .then(result => {
      responseArea.innerHTML = addLinks(JSON.stringify(result, null, 2))
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

const addLinks = str =>
  str.replace(/"(https?:\/\/.+\..+)"/g, (_, group) => `"<a href="${group}">${group}</a>"`)
