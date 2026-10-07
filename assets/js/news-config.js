// Shared topic queries (Europe PMC syntax). Used by the browser and by scripts/refresh_news.mjs.
(function (g) {
  const T = (a) => 'TITLE:(' + a.map(s => s.includes(' ') || s.includes('-') ? '"' + s + '"' : s).join(' OR ') + ')';
  const TOPICS = [
    { id: 'epitx', label: 'Epigenetic therapies', color: '#00a99d',
      q: T(['HDAC inhibitor','HDAC inhibitors','EZH2 inhibitor','EZH2 inhibitors','DNMT inhibitor','BET inhibitor','BET inhibitors','menin inhibitor','menin inhibitors','KAT6','KAT6A','LSD1 inhibitor','PRMT5 inhibitor','PRMT5 inhibitors','DOT1L','IDH inhibitor','IDH1 inhibitor','epigenetic therapy','epigenetic therapies','epigenetic drug','epigenetic drugs','hypomethylating agent','hypomethylating agents','azacitidine','decitabine','tazemetostat','revumenib','ziftomenib','bleximenib','vorinostat','romidepsin','belinostat','epigenetic inhibitor','epigenetic inhibitors','pelabresib']),
      ct: 'HDAC inhibitor OR EZH2 inhibitor OR DNMT inhibitor OR BET inhibitor OR menin inhibitor OR LSD1 inhibitor OR PRMT5 inhibitor OR KAT6 inhibitor OR azacitidine OR decitabine OR tazemetostat OR revumenib OR ziftomenib OR vorinostat OR romidepsin OR belinostat OR pelabresib' },
    { id: 'ptm', label: 'PTMs', color: '#e0336a',
      q: T(['histone acetylation','histone methylation','histone modification','histone modifications','post-translational modification','post-translational modifications','histone lactylation','histone demethylase','histone methyltransferase','histone acetyltransferase','H3K27me3','H3K4me3','H3K27ac','H3K9me3','lysine acetylation','lysine methylation','crotonylation','SUMOylation','lactylation','ubiquitination']) + ' NOT TITLE:(plant OR plants OR Arabidopsis OR rice OR maize OR wheat OR soybean)' },
    { id: 'tf', label: 'Transcription factors', color: '#e08a00',
      q: T(['transcription factor','transcription factors','MYC','c-Myc','pioneer factor','super-enhancer','super-enhancers','transcriptional regulator','transcriptional addiction']) + ' AND ' + T(['cancer','tumor','tumour','leukemia','leukaemia','carcinoma','chromatin','oncogenic','degrader','lymphoma']) },
    { id: 'cancer', label: 'Cancer therapies', color: '#6d4bff',
      q: T(['cancer','tumor','tumour','leukemia','leukaemia','lymphoma','myeloma','carcinoma','melanoma','glioblastoma']) + ' AND ' + T(['phase 1','phase 2','phase 3','phase I','phase II','phase III','first-in-human','randomized','randomised']) + ' NOT TITLE:(sedation OR anesthesia OR anaesthesia OR analgesia OR pain OR block OR exercise OR nursing OR acupuncture OR dexmedetomidine OR remimazolam OR nutrition OR psychological)' },
    { id: 'epi', label: 'Epigenetics', color: '#2f7bff',
      q: T(['DNA methylation','methylome','methylomes','epigenetic clock','epigenetic clocks','cfDNA methylation','methylation biomarker','methylation biomarkers','methylation signature','epigenome','epigenomic','epigenomics','chromatin accessibility','5-hydroxymethylcytosine']) }
  ];
  const JUNK = /corrigendum|erratum|retraction|retracted|correction to|author correction|publisher correction|expression of concern/i;
  g.GQ_NEWS = { TOPICS, JUNK };
  if (typeof module !== 'undefined') module.exports = g.GQ_NEWS;
})(typeof window !== 'undefined' ? window : globalThis);
