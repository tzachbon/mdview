/**
 * C4 diagram to ASCII art renderer
 * Parses C4Context and C4Container diagram syntax and renders to ASCII
 */

interface C4Element {
  type: 'Person' | 'System' | 'Container' | 'Component';
  id: string;
  label: string;
  description: string;
}

interface C4Boundary {
  type: 'Enterprise_Boundary' | 'System_Boundary' | 'Container_Boundary';
  id: string;
  label: string;
  elements: string[];
}

interface C4Relationship {
  from: string;
  to: string;
  label: string;
}

interface ParsedC4 {
  title?: string;
  elements: Map<string, C4Element>;
  boundaries: C4Boundary[];
  relationships: C4Relationship[];
}

/**
 * Parses C4 diagram code into structured data
 */
function parseC4(code: string): ParsedC4 {
  const result: ParsedC4 = {
    elements: new Map(),
    boundaries: [],
    relationships: [],
  };

  const lines = code.trim().split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('%%')) continue;
    
    // Parse title
    if (trimmed.startsWith('title ')) {
      result.title = trimmed.substring(6).trim();
      continue;
    }
    
    // Parse C4Context or C4Container
    if (trimmed === 'C4Context' || trimmed === 'C4Container' || trimmed === 'C4Component') {
      continue;
    }
    
    // Parse boundaries
    const boundaryMatch = trimmed.match(/^(Enterprise_Boundary|System_Boundary|Container_Boundary)\((\w+),\s*"([^"]+)"\)\s*\{?$/);
    if (boundaryMatch) {
      result.boundaries.push({
        type: boundaryMatch[1] as any,
        id: boundaryMatch[2]!,
        label: boundaryMatch[3]!,
        elements: [],
      });
      continue;
    }
    
    // Parse Person
    const personMatch = trimmed.match(/^Person\((\w+),\s*"([^"]+)"(?:,\s*"([^"]+)")?\)$/);
    if (personMatch) {
      result.elements.set(personMatch[1]!, {
        type: 'Person',
        id: personMatch[1]!,
        label: personMatch[2]!,
        description: personMatch[3] || '',
      });
      // Add to last boundary if exists
      if (result.boundaries.length > 0) {
        result.boundaries[result.boundaries.length - 1]!.elements.push(personMatch[1]!);
      }
      continue;
    }
    
    // Parse System/Container/Component
    const systemMatch = trimmed.match(/^(System|Container|Component)\((\w+),\s*"([^"]+)"(?:,\s*"([^"]+)")?\)$/);
    if (systemMatch) {
      result.elements.set(systemMatch[2]!, {
        type: systemMatch[1] as any,
        id: systemMatch[2]!,
        label: systemMatch[3]!,
        description: systemMatch[4] || '',
      });
      // Add to last boundary if exists
      if (result.boundaries.length > 0) {
        result.boundaries[result.boundaries.length - 1]!.elements.push(systemMatch[2]!);
      }
      continue;
    }
    
    // Parse Rel
    const relMatch = trimmed.match(/^Rel\((\w+),\s*(\w+),\s*"([^"]+)"/);
    if (relMatch) {
      result.relationships.push({
        from: relMatch[1]!,
        to: relMatch[2]!,
        label: relMatch[3]!,
      });
      continue;
    }
    
    // Closing brace for boundaries
    if (trimmed === '}') {
      continue;
    }
  }
  
  return result;
}

/**
 * Renders a box with text centered
 */
function renderBox(label: string, description: string, width: number, icon: string): string[] {
  const lines: string[] = [];
  const innerWidth = width - 4;
  
  // Top border
  lines.push('┌─' + '─'.repeat(innerWidth) + '─┐');
  
  // Icon and label (truncate if too long)
  const iconLabel = `${icon} ${label}`;
  const truncatedLabel = iconLabel.length > innerWidth ? iconLabel.substring(0, innerWidth - 3) + '...' : iconLabel;
  const labelPadding = Math.max(0, Math.floor((innerWidth - truncatedLabel.length) / 2));
  const labelRightPad = Math.max(0, innerWidth - labelPadding - truncatedLabel.length);
  lines.push('│ ' + ' '.repeat(labelPadding) + truncatedLabel + ' '.repeat(labelRightPad) + ' │');
  
  // Description if present (truncate if too long)
  if (description) {
    const truncatedDesc = description.length > innerWidth ? description.substring(0, innerWidth - 3) + '...' : description;
    const descPadding = Math.max(0, Math.floor((innerWidth - truncatedDesc.length) / 2));
    const descRightPad = Math.max(0, innerWidth - descPadding - truncatedDesc.length);
    lines.push('│ ' + ' '.repeat(descPadding) + truncatedDesc + ' '.repeat(descRightPad) + ' │');
  }
  
  // Bottom border
  lines.push('└─' + '─'.repeat(innerWidth) + '─┘');
  
  return lines;
}

/**
 * Renders parsed C4 diagram to ASCII art
 */
function renderC4ToAscii(parsed: ParsedC4): string {
  const output: string[] = [];
  const boxWidth = 18;
  const cols = 3;
  
  // Calculate boundary inner width
  // Format: "║  " + boxes with spacing + " ║"
  // Each box is boxWidth chars (18), with 2 spaces between boxes
  const boundaryInnerWidth = 2 + boxWidth * cols + 2 * (cols - 1) + 1;
  
  // Title
  if (parsed.title) {
    output.push(parsed.title);
    output.push('='.repeat(parsed.title.length));
    output.push('');
  }
  
  // Render boundaries and their elements
  if (parsed.boundaries.length > 0) {
    for (const boundary of parsed.boundaries) {
      // Boundary header - adjust to match content width
      const headerPadding = Math.max(0, boundaryInnerWidth - boundary.label.length - 3);
      output.push(`╔═ ${boundary.label} ${'═'.repeat(headerPadding)}╗`);
      output.push('║' + ' '.repeat(boundaryInnerWidth) + '║');
      
      // Render elements in this boundary
      const rows = Math.ceil(boundary.elements.length / cols);
      
      for (let row = 0; row < rows; row++) {
        const maxHeight = 6; // Max lines per box
        const rowBoxes: string[][] = [];
        
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          if (idx < boundary.elements.length) {
            const elementId = boundary.elements[idx]!;
            const element = parsed.elements.get(elementId);
            if (element) {
              const icon = element.type === 'Person' ? '👤' : '📦';
              const box = renderBox(element.label, element.description, boxWidth, icon);
              rowBoxes.push(box);
            }
          } else {
            rowBoxes.push([]);
          }
        }
        
        // Output row
        for (let line = 0; line < maxHeight; line++) {
          let rowLine = '║  ';
          for (let col = 0; col < cols; col++) {
            const box = rowBoxes[col];
            if (box && box[line]) {
              rowLine += box[line];
            } else {
              rowLine += ' '.repeat(boxWidth);
            }
            if (col < cols - 1) rowLine += '  ';
          }
          rowLine += ' ║';
          output.push(rowLine);
        }
        
        if (row < rows - 1) {
          output.push('║' + ' '.repeat(boundaryInnerWidth) + '║');
        }
      }
      
      output.push('║' + ' '.repeat(boundaryInnerWidth) + '║');
      output.push('╚' + '═'.repeat(boundaryInnerWidth) + '╝');
      output.push('');
    }
  } else {
    // Render elements without boundaries in a simple grid
    const elementList = Array.from(parsed.elements.values());
    const cols = 3;
    const rows = Math.ceil(elementList.length / cols);
    
    for (let row = 0; row < rows; row++) {
      const maxHeight = 6;
      const rowBoxes: string[][] = [];
      
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (idx < elementList.length) {
          const element = elementList[idx]!;
          const icon = element.type === 'Person' ? '👤' : '📦';
          const box = renderBox(element.label, element.description, boxWidth, icon);
          rowBoxes.push(box);
        } else {
          rowBoxes.push([]);
        }
      }
      
      for (let line = 0; line < maxHeight; line++) {
        let rowLine = '';
        for (let col = 0; col < cols; col++) {
          const box = rowBoxes[col];
          if (box && box[line]) {
            rowLine += box[line];
          } else {
            rowLine += ' '.repeat(boxWidth + 4);
          }
          if (col < cols - 1) rowLine += '  ';
        }
        output.push(rowLine);
      }
      
      if (row < rows - 1) {
        output.push('');
      }
    }
  }
  
  // Render relationships
  if (parsed.relationships.length > 0) {
    output.push('');
    output.push('Relationships:');
    output.push('─'.repeat(40));
    for (const rel of parsed.relationships) {
      const fromEl = parsed.elements.get(rel.from);
      const toEl = parsed.elements.get(rel.to);
      if (fromEl && toEl) {
        output.push(`  ${fromEl.label} ──[${rel.label}]──> ${toEl.label}`);
      }
    }
  }
  
  return output.join('\n');
}

/**
 * Checks if code is a C4 diagram
 */
export function isC4Diagram(code: string): boolean {
  const trimmed = code.trim();
  return trimmed.includes('C4Context') || 
         trimmed.includes('C4Container') || 
         trimmed.includes('C4Component');
}

/**
 * Renders C4 diagram to ASCII art
 * Returns null if not a C4 diagram or throws on error
 */
export function renderC4(code: string): string | null {
  if (!isC4Diagram(code)) {
    return null;
  }
  
  const parsed = parseC4(code);
  return renderC4ToAscii(parsed);
}
