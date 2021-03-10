# markdown-it-citations

> citation plugin for [markdown-it](https://github.com/markdown-it/markdown-it) markdown parser.

## Syntax

Syntax based on Pandoc [`citations`](https://pandoc.org/MANUAL.html#extension-citations). 

## Example: Minimal integration with `citeproc-rs/wasm``

````javascript
import md from 'markdown-it'
import citations from 'markdown-it-citations'
import * as citeproc from 'citeproc-rs/wasm'
import style from './ieee.csl' // csl style 
import bib from './bib.json' // csl json bibliography

const engine = md().use(citations,{
  //'suppress-bibliography': false,    
  citeproc: () => {
    const driver = citeproc.Driver.new({
      format: 'html',
      style
    })
    driver.insertReferences(bib)
    let noteId = 1
    let fullRender
    let citations = []
    return {
      appendCluster(cluster) {
        const id = 'cite-' + (noteId++)
        citations.push({id})
        driver.insertCluster({
          id,
          cites: cluster.map(c => ({
            id: c.citationId
          }))
        })
      },
      renderCluster(id,renderer) {
        if (!fullRender) {
            driver.setClusterOrder(citations)
            fullRender = driver.fullRender().unwrap()
        }
        return fullRender.allClusters[id]
      },
      renderBibliography() {
        if (!fullRender) {
            driver.setClusterOrder(citations)
            fullRender = driver.fullRender().unwrap()
        }
        return fullRender.bibEntries.map(x => 
            `<div class='csl-entry' id='bib:${x.id}'>${x.value}</div>`
          ).join('\n')        
      }
    }
  }
})
````

note that `citationPrefix`, `citationSuffix` and so on is not used in the above
example and thus only works for simple citations. 