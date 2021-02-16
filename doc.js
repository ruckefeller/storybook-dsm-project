"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
main().catch(console.error);
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var directory, filePaths, program;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    directory = path.resolve(__dirname, './stories');
                    filePaths = readDirectory(directory);
                    program = ts.createProgram(filePaths, {});
                    return [4 /*yield*/, program.getSourceFiles().forEach(function (sourceFile) {
                            if (!sourceFile.isDeclarationFile) {
                                var documentation = getClassDefinitions(sourceFile, program);
                                writeDocumentationFile(sourceFile.fileName, documentation);
                            }
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function readDirectory(directory) {
    var files = [];
    fs.readdirSync(directory).forEach(function (file) {
        var fullPath = path.resolve(directory, file);
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
function getClassDefinitions(sourceFile, program) {
    var checker = program.getTypeChecker();
    var output = [];
    ts.forEachChild(sourceFile, function (child) { return visit(child, output); });
    return JSON.stringify(output, undefined, 4);
    function visit(node, accumulator) {
        if (accumulator === void 0) { accumulator = []; }
        if (!node.hasOwnProperty('name')) {
            return;
        }
        var serialized = serialize(node);
        if (ts.isClassDeclaration(node)) {
            var props_1 = [];
            if (node.getChildCount() > 0) {
                ts.forEachChild(node, function (child) { return visit(child, props_1); });
            }
            serialized = __assign(__assign({}, serialized), { props: props_1 });
        }
        accumulator.push(serialized);
    }
    function serialize(node) {
        var symbol = checker.getSymbolAtLocation(node.name);
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
    function serializeSymbol(symbol) {
        return {
            name: symbol.getName(),
            description: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
            type: checker.typeToString(
            // tslint:disable-next-line: no-non-null-assertion
            checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
        };
    }
    /** Serialize a class symbol information */
    function serializeClass(symbol) {
        // tslint:disable-next-line: no-non-null-assertion
        var constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        var constructors = constructorType.getConstructSignatures().map(serializeSignature);
        var details = serializeSymbol(symbol);
        return {
            name: constructors[0].returnType,
            type: details.type,
            description: details.description,
            constructors: constructors
        };
    }
    /** Serialize a method into a json object */
    function serializeMethod(symbol) {
        // tslint:disable-next-line: no-non-null-assertion
        var methodType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        return __assign(__assign({}, serializeSymbol(symbol)), { signatures: methodType.getCallSignatures().map(serializeSignature) });
    }
    /** Serialize a signature (call or construct) */
    function serializeSignature(signature) {
        return {
            parameters: signature.parameters.map(serializeSymbol),
            returnType: checker.typeToString(signature.getReturnType()),
            description: ts.displayPartsToString(signature.getDocumentationComment(checker))
        };
    }
}
function writeDocumentationFile(targetFilePath, documentation) {
    return __awaiter(this, void 0, void 0, function () {
        var regexp, docFilePath;
        return __generator(this, function (_a) {
            regexp = /(\.component\.ts)|(\.service\.ts)/;
            docFilePath = targetFilePath.split(regexp)[0] + ".docs.json";
            fs.writeFile(docFilePath, documentation, console.error);
            return [2 /*return*/];
        });
    });
}
var CdsDescription = /** @class */ (function () {
    function CdsDescription() {
    }
    return CdsDescription;
}());
var CdsClassDescription = /** @class */ (function (_super) {
    __extends(CdsClassDescription, _super);
    function CdsClassDescription() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(CdsClassDescription.prototype, "displayName", {
        get: function () {
            return this.name;
        },
        enumerable: false,
        configurable: true
    });
    return CdsClassDescription;
}(CdsDescription));
var CdsPropertyDescription = /** @class */ (function (_super) {
    __extends(CdsPropertyDescription, _super);
    function CdsPropertyDescription() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(CdsPropertyDescription.prototype, "value", {
        get: function () {
            return this.name;
        },
        enumerable: false,
        configurable: true
    });
    return CdsPropertyDescription;
}(CdsDescription));
var CdsMethodDescription = /** @class */ (function (_super) {
    __extends(CdsMethodDescription, _super);
    function CdsMethodDescription() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CdsMethodDescription;
}(CdsDescription));
var CdsSignatureDescription = /** @class */ (function () {
    function CdsSignatureDescription() {
    }
    return CdsSignatureDescription;
}());
