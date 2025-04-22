interface DependencyChange {
  name: string;
  oldVersion?: string;
  newVersion?: string;
  action: 'add' | 'remove' | 'update';
  reason?: string;
}

interface DependencyAlternative {
  original: string;
  replacement: string;
  replacementVersion: string;
  reason: string;
}

// Next.js specifikus csomagok és azok Vite-kompatibilis alternatívái
const NEXT_ALTERNATIVES: DependencyAlternative[] = [
  {
    original: 'next',
    replacement: '@vitejs/plugin-react',
    replacementVersion: 'latest',
    reason: 'Next.js keretrendszert lecseréljük Vite alapú React fejlesztőkörnyezetre'
  },
  {
    original: 'next/image',
    replacement: '@unpic/react',
    replacementVersion: 'latest',
    reason: 'Next.js Image komponens helyett optimalizált React képkezelő'
  },
  {
    original: 'next/font',
    replacement: '@fontsource/inter',
    replacementVersion: 'latest',
    reason: 'Next.js font kezelés helyett standard font betöltés'
  },
  {
    original: 'next-auth',
    replacement: '@clerk/clerk-react',
    replacementVersion: 'latest',
    reason: 'Next.js auth könyvtár helyett Vite-kompatibilis auth szolgáltatás'
  },
  {
    original: 'next/head',
    replacement: 'react-helmet-async',
    replacementVersion: 'latest',
    reason: 'Next.js Head komponens helyett React Helmet dokumentum fejléc kezeléshez'
  },
  {
    original: 'next-themes',
    replacement: '@theme-toggles/react',
    replacementVersion: 'latest',
    reason: 'Téma kezelés Vite környezetben'
  },
  {
    original: 'next/navigation',
    replacement: 'react-router-dom',
    replacementVersion: 'latest',
    reason: 'Next.js navigáció helyett React Router'
  }
];

// Vite specifikus csomagok, amiket mindenképp hozzá kell adni
const REQUIRED_VITE_PACKAGES = [
  {
    name: '@vitejs/plugin-react',
    version: 'latest',
    reason: 'React támogatás Vite-hoz'
  },
  {
    name: 'react-router-dom',
    version: 'latest',
    reason: 'Routing funkció Next.js Pages Router helyett'
  }
];

export function analyzeDependencies(packageJson: any): DependencyChange[] {
  const changes: DependencyChange[] = [];
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  // Next.js specifikus függőségek kezelése
  NEXT_ALTERNATIVES.forEach(alternative => {
    if (allDeps[alternative.original]) {
      // Töröljük az eredeti Next.js függőséget
      changes.push({
        name: alternative.original,
        oldVersion: allDeps[alternative.original],
        action: 'remove',
        reason: alternative.reason
      });
      
      // Hozzáadjuk a helyettesítő csomagot, ha szükséges
      if (alternative.replacement && !allDeps[alternative.replacement]) {
        changes.push({
          name: alternative.replacement,
          newVersion: alternative.replacementVersion || 'latest',
          action: 'add',
          reason: alternative.reason
        });
      }
    }
  });

  // Kötelező Vite csomagok hozzáadása, ha még nincsenek
  REQUIRED_VITE_PACKAGES.forEach(pkg => {
    if (!allDeps[pkg.name]) {
      changes.push({
        name: pkg.name,
        newVersion: pkg.version,
        action: 'add',
        reason: pkg.reason
      });
    }
  });

  // Frissítendő csomagok kezelése - pl. ha valami régi verzió van
  const packagesToUpdate = getPackagesToUpdate(allDeps);
  packagesToUpdate.forEach(pkg => {
    changes.push({
      name: pkg.name,
      oldVersion: allDeps[pkg.name],
      newVersion: pkg.recommendedVersion,
      action: 'update',
      reason: pkg.reason
    });
  });

  return changes;
}

interface PackageUpdateRecommendation {
  name: string;
  recommendedVersion: string;
  reason: string;
}

function getPackagesToUpdate(dependencies: Record<string, string>): PackageUpdateRecommendation[] {
  const recommendations: PackageUpdateRecommendation[] = [];
  
  // Példa: ha van régi verzió, ajánljunk újat
  Object.entries(dependencies).forEach(([name, version]) => {
    // React 18 alatt frissítésre van szükség Vite-hoz
    if (name === 'react' && version && !version.includes('18.')) {
      recommendations.push({
        name,
        recommendedVersion: '^18.0.0',
        reason: 'React 18+ ajánlott a Vite projektekhez'
      });
    }
    
    // TypeScript 4.3 alatt frissítésre van szükség
    if (name === 'typescript' && version) {
      const versionNumber = parseInt(version.replace(/[^0-9.]/g, ''));
      if (versionNumber < 4.3) {
        recommendations.push({
          name,
          recommendedVersion: '^4.3.0',
          reason: 'TypeScript 4.3+ ajánlott a Vite projektekhez'
        });
      }
    }
  });
  
  return recommendations;
}

export function generatePackageJsonUpdates(changes: DependencyChange[]): string {
  const updates = changes.map(change => {
    const reasonText = change.reason ? ` (${change.reason})` : '';
    
    switch (change.action) {
      case 'add':
        return `+ ${change.name}@${change.newVersion}${reasonText}`;
      case 'remove':
        return `- ${change.name}${reasonText}`;
      case 'update':
        return `~ ${change.name}: ${change.oldVersion} -> ${change.newVersion}${reasonText}`;
    }
  });

  return updates.join('\n');
}

export function generateInstallCommand(changes: DependencyChange[]): string {
  const toAdd = changes
    .filter(change => change.action === 'add' || change.action === 'update')
    .map(change => `${change.name}@${change.newVersion || 'latest'}`);
    
  const toRemove = changes
    .filter(change => change.action === 'remove')
    .map(change => change.name);
  
  let command = '';
  
  // NPM parancsok generálása
  if (toAdd.length > 0) {
    command += `npm install ${toAdd.join(' ')}\n`;
  }
  
  if (toRemove.length > 0) {
    command += `npm uninstall ${toRemove.join(' ')}\n`;
  }
  
  // PNPM alternatívák
  if (toAdd.length > 0 || toRemove.length > 0) {
    command += '\n# VAGY PNPM-mel:\n';
    
    if (toAdd.length > 0) {
      command += `pnpm add ${toAdd.join(' ')}\n`;
    }
    
    if (toRemove.length > 0) {
      command += `pnpm remove ${toRemove.join(' ')}\n`;
    }
  }
  
  return command;
}

export function checkVersionCompatibility(changes: DependencyChange[]): {
  compatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Példa kompatibilitási ellenőrzés
  const hasReact = changes.some(change => 
    (change.action === 'add' || change.action === 'update') && 
    change.name === 'react'
  );
  
  const hasReactDom = changes.some(change => 
    (change.action === 'add' || change.action === 'update') && 
    change.name === 'react-dom'
  );
  
  // Ellenőrizzük, hogy a React és React DOM verzióik egyeznek-e
  if (hasReact && !hasReactDom) {
    issues.push('React frissítésre kerül, de React DOM nem. Ez verzió eltérésekhez vezethet.');
  }
  
  // További kompatibilitási ellenőrzések
  
  return {
    compatible: issues.length === 0,
    issues
  };
}

export function validatePackageJson(packageJson: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  // Kötelező mezők ellenőrzése
  if (!packageJson.name) {
    result.errors.push('Missing package name');
    result.isValid = false;
  }

  if (!packageJson.version) {
    result.errors.push('Missing package version');
    result.isValid = false;
  }

  // React verzió ellenőrzése
  if (packageJson.dependencies?.react) {
    const reactVersion = packageJson.dependencies.react;
    if (!reactVersion.startsWith('^18') && !reactVersion.startsWith('18')) {
      result.warnings.push('React version should be 18 or higher for Vite compatibility');
    }
  }

  // TypeScript verzió ellenőrzése
  if (packageJson.devDependencies?.typescript) {
    const tsVersion = packageJson.devDependencies.typescript;
    if (parseInt(tsVersion) < 4.3) {
      result.warnings.push('TypeScript version should be 4.3 or higher for Vite compatibility');
    }
  }

  return result;
}
