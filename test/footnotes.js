'use strict';

import path from 'path';
import url from 'url';
import footnote from 'markdown-it-footnote';
import generate from 'markdown-it-testgen';
import markdown from 'markdown-it';
import plugin from '../dist/index.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('compatibility: markdown-it-footnote', function () {  
  var md = markdown().use(plugin,{
    citeproc: (env) => {
      const cites = []
      return { // this setup is only for testing and prints all the information about the citation without formating it
        appendCluster(cluster) {
          return cites.push(cluster) - 1
        },
        renderCluster(id,renderer) {
          const str = cites[id].map(cite => `(${cite.citationMode}|${renderer.render(cite.citationPrefix)}|${cite.citationId}|${renderer.render(cite.citationSuffix)})`).join(';') 
          return str
        }
      }
    },    
    'suppress-bibliography': true
  });
  md.use(footnote);

  generate(path.join(__dirname, 'fixtures/footnotes.txt'), md);
});