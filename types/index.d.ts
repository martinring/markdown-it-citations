import type { PluginWithOptions } from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import type Token from 'markdown-it/lib/token';
declare type CitationMode = 'AuthorInText' | 'SuppressAuthor' | 'NormalCitation';
export interface Citation {
    citationId: string;
    citationPrefix: Token[];
    citationSuffix: Token[];
    citationMode: CitationMode;
    citationNoteNum: number;
    citationHash: number;
}
interface CiteProc<T> {
    appendCluster(cluster: Citation[]): T;
    renderCluster(id: T, renderer: Renderer): string;
    renderBibliography(): string;
}
interface CitationOptions {
    citeproc: (env: object) => CiteProc<any>;
    "suppress-bibliography"?: boolean;
    "reference-section-title"?: string;
}
declare const Citations: PluginWithOptions<CitationOptions>;
export default Citations;
