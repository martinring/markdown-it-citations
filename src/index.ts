import type { PluginWithOptions } from 'markdown-it'
import Renderer from 'markdown-it/lib/renderer'
import type Token from 'markdown-it/lib/token'

type CitationMode = 'AuthorInText' | 'SuppressAuthor' | 'NormalCitation'

export interface Citation {
  citationId: string,
  citationPrefix: Token[],
  citationSuffix: Token[],
  citationMode: CitationMode,
  citationNoteNum: number,
  citationHash: number
}

interface CiteProc<T> {    
  appendCluster(cluster: Citation[]): T
  renderCluster(id: T, renderer: Renderer): string
  renderBibliography(): string
}

interface CitationOptions {
  citeproc: (env: object) => CiteProc<any>
}

const Citations: PluginWithOptions<CitationOptions> = (md,options) => {
  const regexes = {
    citation: /^([^^-]|[^^].+?)?(-)?@([\w][\w:.#$%&\-+?<>~\/]*)(.+)?$/,
    inText: /^@([\w][\w:.#$%&\-+?<>~\/]*)(\s*)(\[)?/,
    allowedBefore: /^[^a-zA-Z.0-9]$/
  }

  md.inline.ruler.after('emphasis', 'citation', (state,silent) => {
    let max = state.posMax
    const char = state.src.charCodeAt(state.pos)
    if (char == 0x40 /* @ */ && 
      (state.pos == 0 || regexes.allowedBefore.test(state.src.slice(state.pos - 1, state.pos)))) { // in-text      
      const match = state.src.slice(state.pos).match(regexes.inText)
      if (match) {        
        const citeproc: CiteProc<any> | undefined = options?.citeproc ? state.env.citeproc || (state.env.citeproc = options?.citeproc(state.env)) : undefined
        let citation: Citation = {
          citationId: match[1],
          citationPrefix: [],
          citationSuffix: [],
          citationMode: 'AuthorInText',
          citationNoteNum: (state.env.noteNum = (state.env.noteNum || 0) + 1),
          citationHash: 0          
        }
        let token: Token | undefined
        if (!silent) {
          token = state.push('cite_open', 'span', 1)
          token.attrSet('class','citation')
          token.attrSet('data-cites', match[1])
        }
        if (match[3]) { // suffix is there
          const suffixStart = state.pos + match[0].length
          const suffixEnd = state.md.helpers.parseLinkLabel(state, suffixStart)
          const charAfter = state.src.codePointAt(suffixEnd + 1)
          if (suffixEnd > 0 && charAfter != 0x28 && charAfter != 0x5B /* ( or [ */) {
            const suffix = state.src.slice(suffixStart, suffixEnd)
            citation.citationSuffix = state.md.parseInline(suffix,state.env)
            state.pending += match[0] + suffix + ']'
            state.pos += match[0].length + suffixEnd - suffixStart + 1
          } else {
            state.pending += '@' + match[1]
            state.pos += match[0].length - match[2].length - match[3].length
          }
        } else {
          state.pos += match[0].length - match[2].length
        }
        if (token) {
          token.meta = citeproc?.appendCluster([citation])     
          state.pushPending()
          state.push('cite_close', 'span', -1)
        }
        return true
      }
    } else if (char == 0x5B /* [ */) {
      const end = state.md.helpers.parseLinkLabel(state, state.pos)
      const charAfter = state.src.codePointAt(end + 1)
      if (end > 0 && charAfter != 0x28 && charAfter != 0x5B) {
        const str = state.src.slice(state.pos + 1,end)
        const parts = str.split(';').map(x => x.match(regexes.citation))
        if (parts.indexOf(null) >= 0) {
          return false
        } else {
          const citeproc: CiteProc<any> | undefined = options?.citeproc ? state.env.citeproc || (state.env.citeproc = options?.citeproc(state.env)) : undefined
          const cites: Citation[] = (parts as RegExpMatchArray[]).map(x => ({
            citationId: x[3],
            citationPrefix: x[1] ? state.md.parseInline(x[1], state.env) : [],
            citationSuffix: x[4] ? state.md.parseInline(x[4], state.env) : [],
            citationMode: x[2] ? 'SuppressAuthor' : 'NormalCitation',
            citationNoteNum: (state.env.noteNum = (state.env.noteNum || 0) + 1),
            citationHash: 0            
          }))          
          if (!silent) {            
            const token = state.push('cite_open','span',1);
            token.meta = citeproc?.appendCluster(cites)
            token.attrSet('class','citation')
            token.attrSet('data-cites',cites.map(x => x.citationId).join(' '))
            state.pending = state.src.slice(state.pos,end + 1);
            state.push('cite_close','span',-1);
          }
          state.pos = end + 1
          return true
        }        
      }      
      return false
    }
    return false
  })  

  if (options?.citeproc) {    
    md.renderer.rules['cite_open'] = (tkns,idx,opts,env,slf) => {
      const citeproc = env.citeproc || options.citeproc(env)
      tkns[idx+1].content = ''
      return citeproc.renderCluster(tkns[idx].meta,slf)
    }
    md.renderer.rules['cite_close'] = () => ''  
  }
}

export default Citations