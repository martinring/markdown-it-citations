import type { PluginWithOptions } from 'markdown-it';
declare type CitationMode = 'AuthorInText' | 'SuppressAuthor' | 'NormalCitation';
export interface Citation {
    citationId: string;
    citationPrefix?: string;
    citationSuffix?: string;
    citationMode: CitationMode;
    citationNoteNum: number;
    citationHash: number;
}
interface CiteProc<T> {
    appendCluster(cluster: Citation[]): T;
    renderCluster(id: T): string;
    renderBibliography(): string;
}
interface CitationOptions {
    citeproc: (env: object) => CiteProc<any>;
}
declare const Citations: PluginWithOptions<CitationOptions>;
export default Citations;
