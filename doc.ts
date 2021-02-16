import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

main().catch(console.error);

async function main(): Promise<any> {
  const directory = path.resolve(__dirname, './stories');
  const filePaths = readDirectory(directory);

  const program: ts.Program = ts.createProgram(filePaths, { });

  await program.getSourceFiles().forEach(sourceFile => {
    if (!sourceFile.isDeclarationFile) {
      const documentation = getClassDefinitions(sourceFile, program);
      writeDocumentationFile(sourceFile.fileName, documentation);
    }
  });
}


function readDirectory(directory): string[] {
  const files = [];

  fs.readdirSync(directory).forEach((file) => {
    const fullPath = path.resolve(directory, file);

    if (fs.statSync(fullPath).isDirectory()) {
      readDirectory(fullPath);

      return;
    }

    if (!/\.component\.ts$/.test(fullPath)) {
      return;
    }

    files.push(fullPath);
  });

  return files;
}

function getClassDefinitions(sourceFile, program): string {
  const checker: ts.TypeChecker =  program.getTypeChecker();
  const output: any[] = [];

  ts.forEachChild(sourceFile, child => visit(child, output));

  return JSON.stringify(output, undefined, 4);

  function visit(node: ts.Node, accumulator: any[] = []): void {
    if (!node.hasOwnProperty('name')) {
      return;
    }

    let serialized = serialize(node as ts.NamedDeclaration) as any;

    if (ts.isClassDeclaration(node)) {
      const props = [];
      if (node.getChildCount() > 0) {
        ts.forEachChild(node, child => visit(child, props));
      }

      serialized = { ...serialized, props };
    }

    accumulator.push(serialized);
  }

  function serialize(node: ts.NamedDeclaration): CdsDescription {
    const symbol = checker.getSymbolAtLocation(node.name);

    if (symbol) {
      if (ts.isClassDeclaration(node)) {
        return serializeClass(symbol);
      }

      if (ts.isPropertyDeclaration(node)) {
        return serializeSymbol(symbol);
      }

      if (ts.isMethodDeclaration(node)) {
        return serializeMethod(symbol);
      }

      if (ts.isGetAccessorDeclaration(node)) {
        return serializeMethod(symbol);
      }
    }
  }

  /** Serialize a symbol into a json object */
  function serializeSymbol(symbol: ts.Symbol): CdsDescription {
    return {
      name: symbol.getName(),
      description: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
      type: checker.typeToString(
        // tslint:disable-next-line: no-non-null-assertion
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
      )
    };
  }

  /** Serialize a class symbol information */
  function serializeClass(symbol: ts.Symbol): CdsClassDescription {
    // tslint:disable-next-line: no-non-null-assertion
    const constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
    const constructors = constructorType.getConstructSignatures().map(serializeSignature);
    const details = serializeSymbol(symbol);

    return {
      name: constructors[0].returnType,
      type: details.type,
      description: details.description,
      constructors
    } as CdsClassDescription;
  }

  /** Serialize a method into a json object */
  function serializeMethod(symbol: ts.Symbol): CdsMethodDescription {
    // tslint:disable-next-line: no-non-null-assertion
    const methodType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);

    return {
      ...serializeSymbol(symbol),
      signatures: methodType.getCallSignatures().map(serializeSignature)
    };
  }

  /** Serialize a signature (call or construct) */
  function serializeSignature(signature: ts.Signature): CdsSignatureDescription {
    return {
      parameters: signature.parameters.map(serializeSymbol),
      returnType: checker.typeToString(signature.getReturnType()),
      description: ts.displayPartsToString(signature.getDocumentationComment(checker))
    };
  }
}

async function writeDocumentationFile(targetFilePath: string, documentation: string): Promise<any> {
  const regexp = /(\.component\.ts)|(\.service\.ts)/;
  const docFilePath = `${ targetFilePath.split(regexp)[0] }.docs.json`;

  fs.writeFile(docFilePath, documentation, console.error);
}

class CdsDescription {
  name: string;
  type: string;
  description: string;
}

class CdsClassDescription extends CdsDescription {
  constructors: any;
  props: CdsPropertyDescription [];

  get displayName(): string {
    return this.name;
  }
}

class CdsPropertyDescription extends CdsDescription {
  get value(): string {
    return this.name;
  }
}

class CdsMethodDescription extends CdsDescription {
  signatures: CdsSignatureDescription[];
}

class CdsSignatureDescription {
  parameters: any;
  returnType: any;
  description: any;
}
