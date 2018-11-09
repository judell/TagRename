var allTags = {}

hlib.createUserInputForm(hlib.getById('userContainer'))
hlib.createApiTokenInputForm(hlib.getById('tokenContainer'))

function initializeTagDiv(tag) {
  return `<div class="tag" id="${tag}"><a onclick="addRenameUX('${tag}')">${tag}</a> ${allTags[tag]} </div>`
}

function addRenameUX(tag) {
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
  element.innerHTML += ` <input class="renamer" id="_${tag}" onchange="rename('${tag}')" ></input> <button onclick="rename('${tag}')">rename</button> <button onclick="cancelSetup('${tag}')">cancel</button>`
}

// rename an individual tag
function rename(tag) {
  let fromTag = tag, toTag = hlib.getById(`_${tag}`).value
  let params = {
    user: hlib.getUser(),
    max: 500,
    tag: fromTag
  }      
  hlib.hApiSearch(params, processRenameResults)
}

function cancelSetup(tag) {
  let element = hlib.getById(tag)
  element.outerHTML = initializeTagDiv(tag)
}

function processSearchResults(annos, replies) {
  annos = annos.concat(replies)
  annos.forEach(anno => {
    anno.tags.forEach(tag => {
      tag = tag.replace(/"/g,'').trim()
      if (!allTags.hasOwnProperty(tag)) {
        allTags[tag] = 1
      } else {
        allTags[tag] += 1
      }
    })
  })
  let tagList = Object.keys(allTags).sort()
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

let params = {
  user: hlib.getUser(),
  max: 100
}

if (hlib.getUser()) {
  hlib.hApiSearch(params, processSearchResults, 'progress')
}

// hide the token input form if token already saved to localStorage
setTimeout(_ => {
  if (! hlib.getUser()) {
    alert('Please enter your Hypothesis username and refresh the page.')

  }
  let token = hlib.getToken()
  if (token) {
    hlib.getById('tokenContainer').style.display = 'none'
  }
}, 500)
