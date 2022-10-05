export const initialBefore = `// This is the source code for the app you are currently using

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Editor, { DiffEditor, useMonaco } from '@monaco-editor/react';
import S from 'subsecond';
import { Position, editor } from 'monaco-editor';

(window as any).S = S;

const Container = styled.div\`\`;

const Content = styled.div\`
  display: flex;
  flex-direction: 'row';
\`;

const SUBSECOND_D_TS = \`
interface Subsecond extends Iterable<SubsecondNode> {
    (selector?: Selector, context?: Subsecond): Subsecond;
    new (selector?: Selector, context?: Subsecond): Subsecond;
    init: init;
    constructor: typeof Subsecond;
    type(): string;
    text(): string;
    text(newText: string | ((oldText: string) => string)): Subsecond;
    name(): string;
    name(newName: string | ((oldName: string) => string)): Subsecond;
    attr(name: string): string | boolean | undefined;
    before(newNode: string): Subsecond;
    after(newNode: string): Subsecond;
    lines(): number;
    eq(index: number): Subsecond;
    length: number;
    each(callback: (element: Subsecond, i: number, original: Subsecond) => void): Subsecond;
    map<T>(callback: (element: Subsecond, i: number, original: Subsecond) => T): T[];
    filter(callback: (element: Subsecond, i: number, original: Subsecond) => boolean): Subsecond;
    find(selector: Selector): Subsecond;
    parent(selector?: string | number): Subsecond;
    children(selector?: string): Subsecond;
    fileName(): string;
    esNodes(): Object[];
    toNewFile(fileName: string): Subsecond;
}
declare type Selector = string | Record<string, string> | SubsecondNode[] | SubsecondNode;
declare const S: Subsecond;
\`;

// https://gist.github.com/loilo/f689c8be89d5628109aebee515b63555
function serializeConsoleLog(...args: any[]) {
  let result = [];

  // Format if first argument is a string
  if (typeof args[0] === 'string') {
    let formattedMessage = args
      .shift()
      .replace(/%[csdifoO]/g, (match: string) => {
        // Keep raw token if no substitution args left
        if (args.length === 0) return match;

        switch (match) {
          // Formatting (omitted)
          case '%c':
            args.shift();
            return '';

          // String
          case '%s':
            return String(args.shift());

          // Integer
          case '%d':
          case '%i':
            return parseInt(args.shift());

          // Float
          case '%f':
            return parseFloat(args.shift());

          // Object
          case '%o':
          case '%O':
            return JSON.stringify(args.shift());
        }

        // Keep raw token if not replaced
        return match;
      });

    if (formattedMessage.length > 0) {
      result.push(formattedMessage);
    }
  }

  // Serialize remaining arguments
  let formattedArgs = args.map((arg) => {
    if (typeof arg === 'string') return arg;

    if (S.isSubsecondObject(arg)) {
      return JSON.stringify(arg.map((a) => \`\${a.type()}.\${a.name()}\`));
    }
    let stringifiedObject: string;
    try {
      stringifiedObject = JSON.stringify(arg, null, 2);
    } catch (e) {
      stringifiedObject = JSON.stringify(e, null, 2);
    }
    return stringifiedObject;
  });
  result.push(...formattedArgs);

  return result.join(' ');
}

const TopBarContainer = styled.div\`
  height: 49px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
\`;

const TopBarSection = styled.div\`
  display: flex;
  flex-direction: row;
  align-items: center;
\`;

const Title = styled.h1\`
  margin: 0;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 24px;
\`;

const Link = styled.a\`
  margin-right: 16px;
\`;

function TopBar({}) {
  return (
    <TopBarContainer>
      <TopBarSection>
        <Title>Subsecond Playground</Title>
        <Link href="#">Documentation</Link>
      </TopBarSection>
      <TopBarSection>
        <Link
          target="_blank"
          href="https://github.com/subsecond-llc/subsecond-playground"
        >
          Github
        </Link>
        <Link target="_blank" href="https://forms.gle/PFvcHsMZ3qxCuvwB8">
          Subsecond for VSCode
        </Link>
      </TopBarSection>
    </TopBarContainer>
  );
}

function SubsecondWindow({
  subsecondCode,
  onSubsecondCodeChange,
  consoleLines,
}: {
  subsecondCode: string;
  onSubsecondCodeChange: (code: string) => void;
  consoleLines: string[];
}) {
  return (
    <Container>
      <Editor
        height="calc(80vh - 50px)"
        width="50vw"
        defaultLanguage="typescript"
        options={{ tabSize: 2 }}
        value={subsecondCode}
        onChange={(text) => onSubsecondCodeChange(text ?? '')}
      />
      <Console consoleLines={consoleLines} />
    </Container>
  );
}

const ConsoleContainer = styled.div\`
  height: 20vh;
  width: 50vw;
  z-index: 10;
  background-color: white;
  display: flex;
  flex-direction: column;
\`;

const ConsoleLines = styled.div\`
  overflow-y: scroll;
  height: 100%;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
\`;

const ConsoleLine = styled.div\`
  padding: 2px;
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  min-height: 19px;
  text-align: left;
  padding-left: 16px;
  padding-right: 16px;
  overflow-wrap: anywhere;
\`;

function Console({ consoleLines }: { consoleLines: string[] }) {
  return (
    <ConsoleContainer>
      <TabsContainer>
        <TabButton active={true} type="button">
          Console
        </TabButton>
      </TabsContainer>
      <ConsoleLines>
        {consoleLines.map((consoleLine, i) => (
          <ConsoleLine key={\`\${consoleLine}-\${i}\`}>{consoleLine}</ConsoleLine>
        ))}
      </ConsoleLines>
    </ConsoleContainer>
  );
}

enum Tab {
  BEFORE = 'BEFORE',
  DIFF = 'DIFF',
  AFTER = 'AFTER',
}

const SourceWindowContainer = styled.div\`
  position: relative;
  width: 50wh;
  height: calc(100vh - 80px);
\`;

function SourceWindow({
  beforeCode,
  onBeforeCodeChange,
  afterCode,
}: {
  beforeCode: string;
  onBeforeCodeChange: (code: string) => void;
  afterCode: string;
}) {
  const [tab, setTab] = useState<Tab>(Tab.BEFORE);
  const [lines, setLines] = useState<number>(0);

  const diffEditorRef = useRef<editor.IStandaloneDiffEditor>();

  useEffect(() => {
    setTimeout(
      () =>
        setLines(
          diffEditorRef.current
            ?.getLineChanges()
            ?.reduce(
              (acc, lineChange) =>
                acc +
                1 +
                lineChange.originalEndLineNumber -
                lineChange.originalStartLineNumber,
              0
            ) ?? 0
        ),
      300
    );
  }, [beforeCode, afterCode, diffEditorRef]);

  return (
    <SourceWindowContainer>
      <SourceTabs tab={tab} onTabChange={(tab) => setTab(tab)} lines={lines} />
      {tab === Tab.BEFORE && (
        <BeforeWindow
          beforeCode={beforeCode}
          onBeforeCodeChange={onBeforeCodeChange}
        />
      )}

      {tab === Tab.AFTER && <AfterWindow afterCode={afterCode} />}
      <DiffWindow
        beforeCode={beforeCode}
        afterCode={afterCode}
        diffEditorRef={diffEditorRef}
      />
    </SourceWindowContainer>
  );
}

const TabsContainer = styled.div\`
  height: 30px;
  text-align: left;
\`;

const TabButton = styled.button<{ active: boolean }>\`
  height: 25px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: none;
  margin-left: 4px;
  margin-top: 4px;
  cursor: pointer;

  :hover {
    background-color: #eee;
  }

  background-color: white;
  \${({ active }) => active && \`background-color: #DDD\`}
\`;

const Badge = styled.span\`
  background-color: #38a169;
  color: white;
  font-weight: bold;
  font-size: 12px;
  border-radius: 8px;
  padding: 1px 4px;
  margin-top: -2px;
\`;

function SourceTabs({
  tab,
  onTabChange,
  lines,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  lines: number;
}) {
  return (
    <TabsContainer>
      <TabButton
        active={tab === Tab.BEFORE}
        type="button"
        onClick={() => onTabChange(Tab.BEFORE)}
      >
        Before
      </TabButton>
      <TabButton
        active={tab === Tab.DIFF}
        type="button"
        onClick={() => onTabChange(Tab.DIFF)}
      >
        Diff {lines !== 0 && <Badge>{lines}</Badge>}
      </TabButton>
      <TabButton
        active={tab === Tab.AFTER}
        type="button"
        onClick={() => onTabChange(Tab.AFTER)}
      >
        After
      </TabButton>
    </TabsContainer>
  );
}

function BeforeWindow({
  beforeCode,
  onBeforeCodeChange,
}: {
  beforeCode: string;
  onBeforeCodeChange: (code: string) => void;
}) {
  return (
    <Editor
      height="calc(100vh - 80px)"
      width="50vw"
      defaultLanguage="typescript"
      options={{ tabSize: 2 }}
      value={beforeCode}
      onChange={(text) => onBeforeCodeChange(text ?? '')}
    />
  );
}

function DiffWindow({
  beforeCode,
  afterCode,
  diffEditorRef,
}: {
  beforeCode: string;
  afterCode: string;
  diffEditorRef: React.MutableRefObject<
    editor.IStandaloneDiffEditor | undefined
  >;
}) {
  return (
    <DiffEditor
      height="calc(100vh - 80px)"
      width="50vw"
      language="typescript"
      original={beforeCode}
      modified={afterCode}
      onMount={(editor) => {
        diffEditorRef.current = editor;
      }}
      options={{ renderSideBySide: false, readOnly: true }}
    />
  );
}

function AfterWindow({ afterCode }: { afterCode: string }) {
  return (
    <Editor
      height="calc(100vh - 80px)"
      width="50vw"
      defaultLanguage="typescript"
      options={{ tabSize: 2, readOnly: true }}
      value={afterCode}
    />
  );
}

function App() {
  const [subsecondCode, setSubsecondCode] = useState<string>(
    localStorage.getItem('subsecondCode') ?? ''
  );
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [beforeCode, setBeforeCode] = useState<string>(
    localStorage.getItem('beforeCode') ?? ''
  );
  const [afterCode, setAfterCode] = useState<string>('');

  const [debounceTimeout, setDebounceTimeout] =
    useState<NodeJS.Timeout | null>();

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco == null) return;

    const extraLib =
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        SUBSECOND_D_TS
      );

    const hoverProvider = monaco.languages.registerHoverProvider('typescript', {
      provideHover: (model, position) => {
        S.load({ 'index.tsx': model.getValue() });
        const node = S.getNodeAt(model.getOffsetAt(position), 'index.tsx');
        const startPosition: Position = model.getPositionAt(
          node.attr('range')[0]
        );
        const endPosition: Position = model.getPositionAt(
          node.attr('range')[1]
        );
        return {
          range: new monaco.Range(
            startPosition.lineNumber,
            startPosition.column,
            endPosition.lineNumber,
            endPosition.column
          ),
          contents: [
            {
              value: \`Type: \\\`\${node.type()}\${
                node.name() !== '' ? \`.\${node.name()}\` : ''
              }\\\`\`,
            },
            {
              value: \`Parent type: \\\`\${node.parent().type()}\${
                node.parent().name() !== '' ? \`.\${node.parent().name()}\` : ''
              }\\\`\`,
            },
            {
              value: \`Grandparent type: \\\`\${node.parent().parent().type()}\${
                node.parent().parent().name() !== ''
                  ? \`.\${node.parent().parent().name()}\`
                  : ''
              }\\\`\`,
            },
          ],
        };
      },
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
      jsx: monaco.languages.typescript.JsxEmit.React,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSyntaxValidation: true,
      noSemanticValidation: true,
      noSuggestionDiagnostics: true,
    });

    return () => {
      hoverProvider.dispose();
      extraLib.dispose();
    };
  }, [monaco]);

  // on changes
  useEffect(() => {
    // debounce
    if (debounceTimeout != null) {
      clearTimeout(debounceTimeout);
    }

    setDebounceTimeout(
      setTimeout(() => {
        const _console = console.log;
        const _consoleLines: string[] = [];
        console.log = (...parameters) => {
          _console(parameters);
          _consoleLines.push(serializeConsoleLog(...parameters));
        };
        try {
          S.load({ 'index.tsx': beforeCode });

          eval(subsecondCode);

          setAfterCode(S.print()['index.tsx']);
        } catch (e) {
          console.log(e);
          setAfterCode(beforeCode);
          setConsoleLines([]);
        }
        console.log = _console;
        setConsoleLines(_consoleLines);

        // store in localstorage.
        localStorage.setItem('subsecondCode', subsecondCode);
        localStorage.setItem('beforeCode', beforeCode);
      }, 400)
    );
  }, [subsecondCode, beforeCode]);

  return (
    <div className="App" style={{ overflow: 'hidden' }}>
      <TopBar />
      <Content>
        <SubsecondWindow
          subsecondCode={subsecondCode}
          onSubsecondCodeChange={setSubsecondCode}
          consoleLines={consoleLines}
        />
        <SourceWindow
          beforeCode={beforeCode}
          onBeforeCodeChange={setBeforeCode}
          afterCode={afterCode}
        />
      </Content>
    </div>
  );
}

export default App;
`;

export const initialSubsecond = `
// Sort JSX element attributes alphabetically
S('JSXOpeningElement').each((openingElement) => {
  const attributes = openingElement.children('JSXAttribute');
  if(attributes.length < 2) return;

  const sortedAttributes = attributes.map((attribute) => attribute.text()).sort();
  console.log(openingElement.name(), sortedAttributes);

  attributes.each((attribute, i) => {
    attribute.text(sortedAttributes[i])
  });
})
`;
