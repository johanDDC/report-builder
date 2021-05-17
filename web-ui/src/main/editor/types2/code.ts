/**
 * A convenient class to generate indented text.
 * It prepends the configured indent to each line.
 */
export class Writer {
  private readonly lines: string[] = []
  private current: string = null
  public indent: string = ''

  /**
   * Appends the text. If the text contains line separators ('\n') it prepends the current indent to each new line.
   * Note: the indent is prepended to when any character is added to the new line, not right after line separator:
   * This code:
   * <pre>
   *   writer.append('aa\nbb\n')
   * </pre>
   * May prepend the indent before 'aa' (if the current line has been empty)
   * Always prepends the indent before 'bb' - because of it starts the new line and adds some characters on it
   * Never prepends the indent the next line after 'bb' - because of no character has been added yet
   */
  append(text: string) {
    if (text === '') return
    this.ensureHasCurrent()

    if (text.indexOf('\n') < 0) this.current = this.current + text
    else {
      const lines = text.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        this.ensureHasCurrent()
        this.current += lines[i]
        this.lines.push(this.current)
        this.current = null
      }
      const lastLine = lines[lines.length - 1];
      if (lastLine !== '') {
        this.ensureHasCurrent()
        this.current += lastLine
      }
    }
  }

  /**
   * A convenient method to configure the indent with given number of space characters (' ')
   * @param count
   */
  indentSpaces(count: number) {
    let ind = '';
    for (let i = 0; i < count; i++) ind += ' '
    this.indent = ind
  }

  /** Builds the indented text */
  build(): string {
    let text = ''
    if (this.lines.length > 0) text = this.lines.join('\n') + '\n'
    if (this.current !== null) text += this.current
    return text
  }

  private ensureHasCurrent() {
    if (this.current === null)
      this.current = this.indent
  }
}

export type Content = string | {ind: number, content: Content[]}

export function buildCode(content: Content[], indent: number, writer: Writer) {
  writer.indentSpaces(indent)
  for (let i = 0; i < content.length; i++) {
    const block = content[i];
    if (typeof block === 'string') writer.append(block)
    else {
      buildCode(block.content, indent + block.ind, writer)
      writer.indentSpaces(indent)
    }
  }
}

/**
 * A convenient class to generate indented text with the ability to insert (not just append the end)
 * An instance represents an insertion position, and it supports creation of another (child) instance at the current position.
 * The child instance will insert text at the position where it has been created.
 * Each instance maintains its own indent (expressed as number of spaces). Child indent is larger then its parent indent.
 * Default indent is the same for all instances and is configurable for the root instance only
 */
export class Builder {
  constructor(private readonly defaultIndent: number, private readonly content: Content[] = []) {}

  /**
   * Appends the text at the current position (and promotes the position to the end)
   */
  append(text: string): Builder {
    this.content.push(text)
    return this
  }

  /**
   * A convenient method to append the text and add line separator after it
   * @param text
   */
  appendLine(text: string = ''): Builder {
    return this.append(text + '\n')
  }

  /**
   * A convenient method to create an indented block surrounded by the prefix and the suffix.
   * Usage:
   * <pre>
   *   builder.appendBlock('prefix', 'suffix')
   *      .appendLine('line1')
   *      .appendLine('line2')
   * </pre>
   * Will produce:
   * <pre>
   *   prefix
   *     line1
   *     line2
   *   suffix
   * </pre>
   */
  appendBlock(prefix: string, suffix: string) {
    this.appendLine(prefix)
    const child = this.createSub();
    this.appendLine(suffix)
    return child
  }

  /**
   * Creates a child instance at the current position.
   * @param indent controls child's indent (adds to current indent).
   *               If it is not specified, the default indent is used
   */
  createSub(indent?: number): Builder {
    if (indent === undefined) indent = this.defaultIndent
    const subContent = [];
    this.content.push({ind: indent, content: subContent})
    return new Builder(this.defaultIndent, subContent)
  }

  build(): string {
    const writer = new Writer()
    buildCode(this.content, 0, writer)
    return writer.build()
  }
}



