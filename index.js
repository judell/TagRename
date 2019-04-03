let allTags = {}

const externalLinkStyle = `style="display:inline;width:.6em;height:.6em;margin-left:2px;margin-top:3px;"`

hlib.createUserInputForm(hlib.getById('userContainer'), 'Your Hypothesis username')
hlib.createTagInputForm(hlib.getById('tagContainer'), 'Leave empty to search all tags')
hlib.createMaxInputForm(hlib.getById('maxContainer'))
hlib.createApiTokenInputForm(hlib.getById('tokenContainer'))
hlib.getById('searchButton').onclick = search

function initializeTagDiv(tag) {
  const externalLink = renderIcon('icon-external-link', externalLinkStyle)
  const facetUrl = `https://jonudell.info/h/facet?user=${getUser()}&tag=${tag}&expanded=true&exactTagSearch=true`
  return `
    <div class="tag" id="${tag}">
      <a target="_reviewTag" title="review your use of this tag" href="${facetUrl}"><span class="externalLink">${externalLink}</span></a>
      <a class="renameableTag" title="click to rename" onclick="addRenameUX('${tag}')">${tag}</a>
      <span title="count of tag occurrences" class="count">${allTags[tag]}</span>
    </div>`
}

function getUser() {
  return hlib.getSettings().user
}

function getTag() {
  return hlib.getSettings().tag
}

function renderIcon(iconClass, style) {
  const _style = style ? style : `style="display:block"`
  return `<svg ${style} class="${iconClass}"><use xlink:href="#${iconClass}"></use></svg>`
}

function addRenameUX(tag) {
  if (hlib.getById(`_${tag}`)) {
    return
  }
  let tagDivs = Array.from(document.querySelectorAll('.tag'))
  let tags = tagDivs.map(tagDiv => {
    return tagDiv.innerText
  })
  tags.forEach(_tag => {
    try {
      cancelSetup(_tag)
    } catch (e) {
      console.log(e)
    }
  })
  let element = hlib.getById(tag)
  element.querySelector('a').setAttribute('onclick', null)
  element.innerHTML += ` 
    <input class="renamer" id="_${tag}"></input> 
    <button onclick="rename('${tag}')">rename</button> 
    <button onclick="cancelSetup('${tag}')">cancel</button>`
}

// rename an individual tag
function rename(tag) {
  if (hlib.getById(`_${tag}`).value === '') {
    alert('Cannot rename to nothing')
    return
  }
  let fromTag = tag
  let params = {
    user: getUser(),
    max: hlib.getSettings().max,
    tag: fromTag
  }      
  hlib.search(params)
    .then( data => { 
      processRenameResults(data[0], data[1]) 
    })
}

function cancelSetup(tag) {
  let element = hlib.getById(tag)
  element.outerHTML = initializeTagDiv(tag)
}

function tokenReset() {
  localStorage.setItem('h_token', '')
}

function processSearchResults(annos, replies) {
  annos = annos.concat(replies)
  const _tag = getTag()
  annos.forEach(anno => {
    for (let i = 0; i < anno.tags.length; i++) {
      let tag = anno.tags[i]
      if (_tag && tag !== _tag) {
        continue
      }
      tag = tag.replace(/"/g,'').trim()
      if (!allTags.hasOwnProperty(tag)) {
        allTags[tag] = 1
      } else {
        allTags[tag] += 1
      }
    }
  })
  let tagList = Object.keys(allTags).sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })
  tagList = tagList.map(tag => {
    return initializeTagDiv(tag)
  })
  hlib.getById('tags').innerHTML += tagList.join('\n')
  hlib.getById('progress').innerHTML = ''
}

function processRenameResults(annos, replies) {
  annos = annos.concat(replies)
  let fromTag = document.querySelector('.renamer').parentElement.id
  let toTag = document.querySelector('.renamer').value
  for (i = 0; i < annos.length; i++ ) {
    let anno = annos[i]
    let tags = anno.tags
    let _tags = []
    tags.forEach(tag => {
      if (tag === fromTag) {
        tag = toTag
      }
      _tags.push(tag)
    })
    let payload = {
      tags: _tags
    }
    let payloadJson = JSON.stringify(payload)
    hlib.updateAnnotation(anno.id, hlib.getToken(), payloadJson)
      .then(data => {
        console.log(data)
        if (i == annos.length) {
          hlib.getById(fromTag).innerHTML = `<s>${fromTag}</s> ${toTag}`
        }
      })
  }
}

async function search() {
  if (!getUser()) {
    alert('Please provide the Hypothesis username corresponding to the API token')
    return
  }
  allTags = {}
  hlib.getById('tags').innerHTML = ''
  let params = {
    user: getUser(),
    max: hlib.getSettings().max
  }
  const tag = getTag()
  if (tag) {
    params.tag = tag
  }
  const data = await hlib.search(params, 'progress')
  processSearchResults(data[0], data[1])
}

setTimeout(_ => {
  hlib.manageTokenDisplayAndReset()
}, 200)

