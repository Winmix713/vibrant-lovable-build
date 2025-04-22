
import { ConversionOptions } from "@/types/conversion";

export interface DiagnosticCategory {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
}

export interface Diagnostic {
  id: string;
  category: string;
  message: string;
  details?: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  suggestion?: string;
  timestamp: number;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

export interface DiagnosticStatistics {
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  categoryCounts: Record<string, number>;
  fileErrors: Record<string, number>;
  dependenciesWithIssues: string[];
  mostCommonErrors: { message: string; count: number }[];
  conversionRate: number;
  completedSteps: string[];
}

export interface DiagnosticReport {
  project: string;
  timestamp: number;
  statistics: DiagnosticStatistics;
  diagnostics: Diagnostic[];
  conversionOptions: ConversionOptions;
}

// Diagnosztikai kategóriák
const diagnosticCategories: DiagnosticCategory[] = [
  {
    id: 'routing',
    name: 'Útvonalak',
    description: 'Next.js útvonalakkal kapcsolatos problémák és átalakítások.',
    severity: 'warning'
  },
  {
    id: 'component',
    name: 'Komponensek',
    description: 'Next.js specifikus komponensek átalakítása React komponensekre.',
    severity: 'warning'
  },
  {
    id: 'api',
    name: 'API útvonalak',
    description: 'API útvonalak átalakításával kapcsolatos problémák.',
    severity: 'error'
  },
  {
    id: 'data-fetching',
    name: 'Adatlekérés',
    description: 'getServerSideProps, getStaticProps és más adatlekérési metódusok átalakítása.',
    severity: 'warning'
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'TypeScript típusok és interfészek átalakítása.',
    severity: 'warning'
  },
  {
    id: 'dependency',
    name: 'Függőségek',
    description: 'Next.js specifikus függőségek kezelése és átalakítása.',
    severity: 'error'
  },
  {
    id: 'config',
    name: 'Konfiguráció',
    description: 'Next.js konfigurációs fájlok átalakítása Vite konfigurációkra.',
    severity: 'warning'
  },
  {
    id: 'middleware',
    name: 'Middleware',
    description: 'Next.js middleware átalakítása.',
    severity: 'error'
  },
  {
    id: 'optimization',
    name: 'Optimalizáció',
    description: 'Teljesítményoptimalizációs javaslatok.',
    severity: 'info'
  }
];

export class DiagnosticsReporter {
  private project: string;
  private diagnostics: Diagnostic[] = [];
  private conversionOptions: ConversionOptions;
  private completedSteps: Set<string> = new Set();
  private interactiveMode: boolean = false;
  
  constructor(project: string, options: ConversionOptions) {
    this.project = project;
    this.conversionOptions = options;
  }
  
  /**
   * Interaktív mód beállítása
   */
  setInteractiveMode(interactive: boolean): void {
    this.interactiveMode = interactive;
  }
  
  /**
   * Diagnosztikai bejegyzés hozzáadása
   */
  addDiagnostic(diagnostic: Omit<Diagnostic, 'id' | 'timestamp'>): void {
    const id = `${diagnostic.category}-${Date.now()}-${this.diagnostics.length}`;
    
    this.diagnostics.push({
      ...diagnostic,
      id,
      timestamp: Date.now()
    });
    
    if (this.interactiveMode) {
      // Interaktív módban azonnal kiírjuk a diagnosztikákat
      const severitySymbol = {
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }[diagnostic.severity];
      
      console.log(`${severitySymbol} [${diagnostic.category}] ${diagnostic.message}`);
      if (diagnostic.file) {
        console.log(`   📄 ${diagnostic.file}${diagnostic.line ? `:${diagnostic.line}` : ''}`);
      }
      if (diagnostic.suggestion) {
        console.log(`   💡 ${diagnostic.suggestion}`);
      }
    }
  }
  
  /**
   * Több diagnosztikai bejegyzés hozzáadása
   */
  addDiagnostics(diagnostics: Omit<Diagnostic, 'id' | 'timestamp'>[]): void {
    diagnostics.forEach(diagnostic => this.addDiagnostic(diagnostic));
  }
  
  /**
   * Hiba hozzáadása
   */
  addError(category: string, message: string, details?: Partial<Omit<Diagnostic, 'id' | 'timestamp' | 'category' | 'message' | 'severity'>>): void {
    this.addDiagnostic({
      category,
      message,
      ...details,
      severity: 'error'
    });
  }
  
  /**
   * Figyelmeztetés hozzáadása
   */
  addWarning(category: string, message: string, details?: Partial<Omit<Diagnostic, 'id' | 'timestamp' | 'category' | 'message' | 'severity'>>): void {
    this.addDiagnostic({
      category,
      message,
      ...details,
      severity: 'warning'
    });
  }
  
  /**
   * Információs bejegyzés hozzáadása
   */
  addInfo(category: string, message: string, details?: Partial<Omit<Diagnostic, 'id' | 'timestamp' | 'category' | 'message' | 'severity'>>): void {
    this.addDiagnostic({
      category,
      message,
      ...details,
      severity: 'info'
    });
  }
  
  /**
   * Folyamat lépés befejezésének jelzése
   */
  completeStep(step: string): void {
    this.completedSteps.add(step);
    this.addInfo('progress', `${step} lépés befejezve.`);
  }
  
  /**
   * Diagnosztikák lekérdezése
   */
  getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }
  
  /**
   * Diagnosztikai statisztikák generálása
   */
  generateStatistics(): DiagnosticStatistics {
    // Különböző súlyosságú diagnosztikák számolása
    const totalErrors = this.diagnostics.filter(d => d.severity === 'error').length;
    const totalWarnings = this.diagnostics.filter(d => d.severity === 'warning').length;
    const totalInfos = this.diagnostics.filter(d => d.severity === 'info').length;
    
    // Kategóriák számolása
    const categoryCounts: Record<string, number> = {};
    this.diagnostics.forEach(d => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });
    
    // Fájlonkénti hibák számolása
    const fileErrors: Record<string, number> = {};
    this.diagnostics.filter(d => d.file && d.severity === 'error').forEach(d => {
      if (d.file) {
        fileErrors[d.file] = (fileErrors[d.file] || 0) + 1;
      }
    });
    
    // Problémás függőségek
    const dependenciesWithIssues = Array.from(new Set(
      this.diagnostics
        .filter(d => d.category === 'dependency' && d.context?.package)
        .map(d => d.context?.package as string)
    ));
    
    // Leggyakoribb hibák
    const errorMessages = this.diagnostics.filter(d => d.severity === 'error').map(d => d.message);
    const errorCounts: Record<string, number> = {};
    errorMessages.forEach(message => {
      errorCounts[message] = (errorCounts[message] || 0) + 1;
    });
    
    const mostCommonErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Konverziós arány (befejezett lépések / összes lépés)
    const totalSteps = Object.values(this.conversionOptions).filter(v => v === true).length;
    const completedStepsCount = this.completedSteps.size;
    const conversionRate = totalSteps > 0 ? completedStepsCount / totalSteps : 0;
    
    return {
      totalErrors,
      totalWarnings,
      totalInfos,
      categoryCounts,
      fileErrors,
      dependenciesWithIssues,
      mostCommonErrors,
      conversionRate,
      completedSteps: Array.from(this.completedSteps)
    };
  }
  
  /**
   * Diagnosztikai jelentés generálása
   */
  generateReport(): DiagnosticReport {
    return {
      project: this.project,
      timestamp: Date.now(),
      statistics: this.generateStatistics(),
      diagnostics: this.diagnostics,
      conversionOptions: this.conversionOptions
    };
  }
  
  /**
   * Markdown formátumú jelentés generálása
   */
  generateMarkdownReport(): string {
    const stats = this.generateStatistics();
    const report = this.generateReport();
    
    return `# Next.js - Vite konverziós jelentés

## Projekt: ${this.project}
Dátum: ${new Date(report.timestamp).toLocaleDateString('hu-HU')}

## Összefoglaló
- **Hibák**: ${stats.totalErrors}
- **Figyelmeztetések**: ${stats.totalWarnings}
- **Információk**: ${stats.totalInfos}
- **Konverziós arány**: ${(stats.conversionRate * 100).toFixed(1)}%

## Befejezett lépések
${stats.completedSteps.map(step => `- ✅ ${step}`).join('\n')}

## Problémás területek
${Object.entries(stats.categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([category, count]) => {
    const categoryInfo = diagnosticCategories.find(c => c.id === category);
    return `- **${categoryInfo?.name || category}**: ${count} probléma`;
  })
  .join('\n')}

## Legproblémásabb fájlok
${Object.entries(stats.fileErrors)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([file, count]) => `- ${file}: ${count} hiba`)
  .join('\n') || '- Nincsenek fájl-specifikus hibák'}

## Problémás függőségek
${stats.dependenciesWithIssues.map(dep => `- ${dep}`).join('\n') || '- Nincsenek problémás függőségek'}

## Leggyakoribb hibák
${stats.mostCommonErrors.map(error => `- ${error.message} (${error.count}x)`).join('\n') || '- Nincsenek ismétlődő hibák'}

## Részletes diagnosztikák

${this.generateDetailedDiagnosticsMarkdown()}

## Javaslatok

${this.generateSuggestionsMarkdown()}

## Következő lépések

1. Ellenőrizd a kritikus hibákat a fenti listában
2. Tekintsd át a függőségi problémákat
3. Futtasd az alkalmazást fejlesztői módban a runtime hibák felderítéséhez
4. Végezz teljesítménymérést a konvertált alkalmazáson
`;
  }
  
  /**
   * Részletes diagnosztikák Markdown formátumban
   */
  private generateDetailedDiagnosticsMarkdown(): string {
    const severitySymbols = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    // Kategóriák szerinti csoportosítás
    const groupedDiagnostics = this.diagnostics.reduce((groups: Record<string, Diagnostic[]>, diagnostic) => {
      if (!groups[diagnostic.category]) {
        groups[diagnostic.category] = [];
      }
      groups[diagnostic.category].push(diagnostic);
      return groups;
    }, {});
    
    // Kategóriák nevei
    const categoryNames = diagnosticCategories.reduce((names: Record<string, string>, category) => {
      names[category.id] = category.name;
      return names;
    }, {});
    
    // Kategóriánként diagnosztikák megjelenítése
    return Object.entries(groupedDiagnostics)
      .map(([category, diagnostics]) => {
        const categoryName = categoryNames[category] || category;
        
        return `### ${categoryName}

${diagnostics.map(d => {
  let markdown = `#### ${severitySymbols[d.severity]} ${d.message}\n`;
  
  if (d.details) {
    markdown += `\n${d.details}\n`;
  }
  
  if (d.file) {
    markdown += `\n**Fájl:** \`${d.file}${d.line ? `:${d.line}${d.column ? `:${d.column}` : ''}` : ''}\`\n`;
  }
  
  if (d.code) {
    markdown += `\n\`\`\`typescript\n${d.code}\n\`\`\`\n`;
  }
  
  if (d.suggestion) {
    markdown += `\n**Javaslat:** ${d.suggestion}\n`;
  }
  
  return markdown;
}).join('\n')}`;
      })
      .join('\n\n');
  }
  
  /**
   * Javaslatok generálása Markdown formátumban
   */
  private generateSuggestionsMarkdown(): string {
    // Hibák és figyelmeztetések alapján javaslatokat generálunk
    const suggestions: string[] = [];
    
    // Függőségi problémák esetén
    if (this.diagnostics.some(d => d.category === 'dependency' && d.severity === 'error')) {
      suggestions.push('**Függőségek frissítése:**\n' + 
        '- Frissítsd a projekt függőségeit a Vite-kompatibilis verziókra\n' +
        '- Távolítsd el a Next.js-specifikus függőségeket, amelyek nem kompatibilisek\n' +
        '- Fontold meg a npm helyett a pnpm vagy yarn használatát a függőségek kezeléséhez');
    }
    
    // API útvonalakkal kapcsolatos problémák
    if (this.diagnostics.some(d => d.category === 'api' && d.severity === 'error')) {
      suggestions.push('**API útvonalak kezelése:**\n' +
        '- Hozz létre egy különálló Express/Fastify szervert az API útvonalakhoz\n' +
        '- Fontold meg a serverless függvények használatát (pl. Netlify Functions, Vercel Functions) az API útvonalakhoz\n' +
        '- Helyezd át az API logikát egy különálló backend projektbe');
    }
    
    // Middleware-rel kapcsolatos problémák
    if (this.diagnostics.some(d => d.category === 'middleware' && d.severity !== 'info')) {
      suggestions.push('**Middleware-ek kezelése:**\n' +
        '- Alakítsd át a Next.js middleware-eket Express middleware-ekké egy különálló szerveren\n' +
        '- Ahol lehetséges, alakítsd át a middleware logikát React hook-ká\n' +
        '- Fontold meg Auth.js/Next-Auth használatát hitelesítéshez Vite környezetben');
    }
    
    // Adatlekérési metódusokkal kapcsolatos problémák
    if (this.diagnostics.some(d => d.category === 'data-fetching' && d.severity !== 'info')) {
      suggestions.push('**Adatlekérés átalakítása:**\n' +
        '- Használj React Query vagy SWR könyvtárakat a szerveroldali adatok kezeléséhez\n' +
        '- Alakítsd át a getServerSideProps és getStaticProps függvényeket custom hook-okká\n' +
        '- Használd a React Router loader funkcióit a route-szintű adatlekéréshez');
    }
    
    // Ha nincs elég javaslat, adjunk általános javaslatokat
    if (suggestions.length < 3) {
      suggestions.push('**Általános optimalizációk:**\n' +
        '- Használj ESBuild vagy SWC fordítót a TypeScript fordítás gyorsításához Vite környezetben\n' +
        '- Alkalmazz code splitting-et és lazy loading-ot a bundle méret csökkentéséhez\n' +
        '- Fontold meg a React komponensek újrafelhasználhatóságának növelését a komponenskönyvtár kialakításával');
    }
    
    return suggestions.join('\n\n');
  }
  
  /**
   * HTML formátumú jelentés generálása
   */
  generateHtmlReport(): string {
    // Egyszerűsített HTML konverzió a Markdown jelentésből
    const markdown = this.generateMarkdownReport();
    
    // Nagyon egyszerű Markdown-to-HTML átalakítás
    const html = markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\`\`\`([^`]+)\`\`\`/g, '<pre><code>$1</code></pre>')
      .replace(/\`([^`]+)\`/g, '<code>$1</code>');
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Next.js - Vite konverziós jelentés</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    code { background-color: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background-color: #f6f8fa; padding: 16px; border-radius: 3px; overflow: auto; }
    pre code { background-color: transparent; padding: 0; }
    li { margin: 0.25em 0; }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>`;
  }
  
  /**
   * Diagnosztikai eredmények exportálása JSON formátumban
   */
  exportJSON(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }
  
  /**
   * Interaktív hibajavító javaslatok generálása
   */
  generateFixSuggestions(diagnostic: Diagnostic): string[] {
    // Kategória alapján generálunk javaslatokat
    switch (diagnostic.category) {
      case 'routing':
        return this.generateRoutingFixSuggestions(diagnostic);
      case 'component':
        return this.generateComponentFixSuggestions(diagnostic);
      case 'api':
        return this.generateApiFixSuggestions(diagnostic);
      case 'data-fetching':
        return this.generateDataFetchingFixSuggestions(diagnostic);
      case 'typescript':
        return this.generateTypescriptFixSuggestions(diagnostic);
      case 'dependency':
        return this.generateDependencyFixSuggestions(diagnostic);
      default:
        return [
          diagnostic.suggestion || 'Nincsenek automatikus javítási javaslatok ehhez a problémához.'
        ];
    }
  }
  
  /**
   * Útvonalak javítási javaslatai
   */
  private generateRoutingFixSuggestions(diagnostic: Diagnostic): string[] {
    const suggestions: string[] = [];
    
    // Dinamikus útvonal kezelése
    if (diagnostic.message.includes('dynamic route')) {
      suggestions.push('Használd a `useParams` hook-ot a React Router-ből a dinamikus paraméterek eléréséhez.');
      suggestions.push('Alakítsd át a fájl alapú útvonalat React Router route definícióvá.');
    }
    
    // Catch-all útvonalak kezelése
    else if (diagnostic.message.includes('catch-all')) {
      suggestions.push('Használd a `*` (wildcard) útvonal-paramétert a React Router-ben a catch-all útvonalakhoz.');
      suggestions.push('Használd a `useParams` hook-ot a paraméterek tömbként való eléréséhez.');
    }
    
    // Opcionális útvonalak kezelése
    else if (diagnostic.message.includes('optional')) {
      suggestions.push('Használj két különböző útvonal definíciót az opcionális paraméter kezeléséhez.');
    }
    
    if (suggestions.length === 0) {
      suggestions.push(diagnostic.suggestion || 'Nincsenek specifikus javaslatok ehhez a problémához.');
    }
    
    return suggestions;
  }
  
  /**
   * Komponensek javítási javaslatai
   */
  private generateComponentFixSuggestions(diagnostic: Diagnostic): string[] {
    const suggestions: string[] = [];
    
    // Image komponens átalakítása
    if (diagnostic.message.includes('Image')) {
      suggestions.push('Használd az @unpic/react Image komponensét, vagy standard img elemet méret attribútumokkal.');
    }
    // Link komponens átalakítása
    else if (diagnostic.message.includes('Link')) {
      suggestions.push('Használd a React Router Link komponensét, és alakítsd át a "href" attribútumokat "to" attribútumokká.');
    }
    // Head komponens átalakítása
    else if (diagnostic.message.includes('Head')) {
      suggestions.push('Használd a react-helmet-async Helmet komponensét a dokumentum fejléc módosításához.');
    }
    // Script komponens átalakítása
    else if (diagnostic.message.includes('Script')) {
      suggestions.push('Használj standard script elemeket, vagy importáld közvetlenül a szkriptfájlokat.');
    }
    
    if (suggestions.length === 0) {
      suggestions.push(diagnostic.suggestion || 'Nincsenek specifikus javaslatok ehhez a problémához.');
    }
    
    return suggestions;
  }
  
  /**
   * API útvonalak javítási javaslatai
   */
  private generateApiFixSuggestions(diagnostic: Diagnostic): string[] {
    const suggestions: string[] = [];
    
    suggestions.push('Hozz létre egy különálló Express/Fastify szervert az API kezeléséhez.');
    suggestions.push('Alakítsd át a NextApiRequest és NextApiResponse típusokat Express Request és Response típusokká.');
    
    if (diagnostic.message.includes('dynamic')) {
      suggestions.push('Használd az Express útvonal-paramétereit a dinamikus API útvonalakhoz: `/api/user/:id`.');
    }
    
    return suggestions;
  }
  
  /**
   * Adatlekérési metódusok javítási javaslatai
   */
  private generateDataFetchingFixSuggestions(diagnostic: Diagnostic): string[] {
    const suggestions: string[] = [];
    
    if (diagnostic.message.includes('getServerSideProps')) {
      suggestions.push('Használj React Query `useQuery` hook-ot a szerveroldali adatlekérés helyett.');
      suggestions.push('Alakítsd át a getServerSideProps függvény logikáját egy async függvénnyé a fetchQueryFn-hez.');
    }
    else if (diagnostic.message.includes('getStaticProps')) {
      suggestions.push('Használj React Query-t inicializációs adatokkal vagy egy globális state menedzsment eszközt.');
    }
    else if (diagnostic.message.includes('getStaticPaths')) {
      suggestions.push('Definiálj explicit route-okat a statikus elérési utak helyett.');
    }
    
    return suggestions;
  }
  
  /**
   * TypeScript típusok javítási javaslatai
   */
  private generateTypescriptFixSuggestions(diagnostic: Diagnostic): string[] {
    const suggestions: string[] = [];
    
    if (diagnostic.message.includes('NextPage')) {
      suggestions.push('Használd a React.FC<Props> típust a NextPage<Props> helyett.');
    }
    else if (diagnostic.message.includes('GetServerSideProps')) {
      suggestions.push('Használd a UseQueryResult<T> típust a React Query-ből.');
    }
    else if (diagnostic.message.includes('NextApiRequest') || diagnostic.message.includes('NextApiResponse')) {
      suggestions.push('Használd az Express Request és Response típusokat.');
    }
    
    return suggestions;
  }
  
  /**
   * Függőségek javítási javaslatai
   */
  private generateDependencyFixSuggestions(diagnostic: Diagnostic): string[] {
    const suggestions: string[] = [];
    const packageName = diagnostic.context?.package as string;
    
    if (packageName?.startsWith('next')) {
      suggestions.push(`Távolítsd el a '${packageName}' függőséget, mert nem kompatibilis a Vite környezettel.`);
      
      // Helyettesítő csomagok javaslása
      if (packageName === 'next') {
        suggestions.push('Helyettesítsd a Next.js-t React és Vite kombinációjával.');
      }
      else if (packageName === 'next/image') {
        suggestions.push('Használd az @unpic/react csomagot a képoptimalizáláshoz.');
      }
      else if (packageName === 'next/link') {
        suggestions.push('Használd a react-router-dom csomagot az útvonal-navigációhoz.');
      }
      else if (packageName === 'next/head') {
        suggestions.push('Használd a react-helmet-async csomagot a dokumentum fejléc kezeléséhez.');
      }
      else if (packageName === 'next/router') {
        suggestions.push('Használd a react-router-dom csomagot az útvonal-kezeléshez.');
      }
    } else {
      suggestions.push(`Ellenőrizd a '${packageName}' verziószámát a Vite kompatibilitáshoz.`);
    }
    
    return suggestions;
  }
}

// Példa használatra:
/*
const reporter = new DiagnosticsReporter('MyProject', { 
  useReactRouter: true, 
  convertApiRoutes: true,
  transformDataFetching: true,
  replaceComponents: true,
  updateDependencies: true,
  preserveTypeScript: true,
  handleMiddleware: true
});

reporter.addError('routing', 'Dynamic route conversion failed', { 
  file: 'pages/[id].tsx',
  line: 10,
  suggestion: 'Use React Router useParams hook'
});

reporter.addWarning('component', 'Image component requires manual attention', {
  file: 'components/Banner.tsx'
});

reporter.completeStep('Routing analysis');
reporter.completeStep('Component transformation');

const report = reporter.generateMarkdownReport();
console.log(report);
*/

/**
 * Interaktív hibajavítást segítő osztály
 */
export class DiagnosticsFixHelper {
  private reporter: DiagnosticsReporter;
  
  constructor(reporter: DiagnosticsReporter) {
    this.reporter = reporter;
  }
  
  /**
   * Hibajavítási javaslatok kérése
   */
  getFixSuggestions(diagnosticId: string): string[] {
    const diagnostic = this.reporter.getDiagnostics().find(d => d.id === diagnosticId);
    if (!diagnostic) {
      return ['A megadott azonosítójú diagnosztika nem található.'];
    }
    
    return this.reporter.generateFixSuggestions(diagnostic);
  }
  
  /**
   * Automatikus javítás alkalmazása
   */
  applyAutoFix(diagnosticId: string, fixIndex: number = 0): { success: boolean; result?: string; message?: string } {
    const diagnostic = this.reporter.getDiagnostics().find(d => d.id === diagnosticId);
    if (!diagnostic) {
      return { success: false, message: 'A megadott azonosítójú diagnosztika nem található.' };
    }
    
    // Itt valós projekben a tényleges javítás történne, például kódmódosítással
    // Demonstrációs célból csak visszaadunk egy üzenetet
    return {
      success: true,
      result: `Sikeres automatikus javítás: ${diagnostic.message}`,
      message: `A ${diagnostic.category} kategóriájú diagnosztika javítása megtörtént.`
    };
  }
  
  /**
   * Legkritikusabb hibák lekérdezése
   */
  getCriticalDiagnostics(limit: number = 5): Diagnostic[] {
    return this.reporter.getDiagnostics()
      .filter(d => d.severity === 'error')
      .sort((a, b) => {
        // API és függőségi hibák a legfontosabbak
        if (a.category === 'api' && b.category !== 'api') return -1;
        if (a.category !== 'api' && b.category === 'api') return 1;
        if (a.category === 'dependency' && b.category !== 'dependency') return -1;
        if (a.category !== 'dependency' && b.category === 'dependency') return 1;
        
        // Egyébként időbélyeg szerint rendezzük
        return b.timestamp - a.timestamp;
      })
      .slice(0, limit);
  }
}
