import { JSONPathJSONValue, JSONPathNothing } from "@/jsonpath-tools/types";
import { JSONPathNormalizedPath } from "../transformations";

const INDENTATION_SPACE_COUNT = 4;

export class DataTypeAnnotation {
    constructor(
        readonly title: string,
        readonly description: string,
        readonly deprecated: boolean,
        readonly readOnly: boolean,
        readonly writeOnly: boolean,
        readonly defaultValue: JSONPathJSONValue | undefined,
        readonly exampleValues: readonly JSONPathJSONValue[]
    ) { }

    static readonly EMPTY_SET: ReadonlySet<DataTypeAnnotation> = new Set<DataTypeAnnotation>();
}

export abstract class DataType {
    constructor(
        readonly annotations: ReadonlySet<DataTypeAnnotation>
    ) { }

    abstract withAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType;

    addAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType {
        if (annotations.size === 0) 
            return this;
        const newAnnotations = this.annotations.union(annotations);
        return this.withAnnotations(newAnnotations);
    }

    collectAnnotationsToSet(annotations: Set<DataTypeAnnotation>) {
        for (const annotation of this.annotations)
            annotations.add(annotation);
    }

    collectAnnotations(): Set<DataTypeAnnotation> {
        const annotations = new Set<DataTypeAnnotation>();
        this.collectAnnotationsToSet(annotations);
        return annotations;
    }
    
    abstract getChildrenType(): DataType;
    abstract getDescendantType(): DataType;
    abstract getTypeAtPathSegment(segment: string | number): DataType;
    abstract collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void;
    abstract collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void;

    collectKnownPathSegments(): Set<string | number> {
        const knownPathSegments = new Set<string | number>();
        this.collectKnownPathSegmentsToSet(knownPathSegments);
        return knownPathSegments;
    }

    collectKnownLiterals(): Set<string | number | boolean | null> {
        const knownLitarals = new Set<string | number | boolean | null>();
        this.collectKnownLiteralsToSet(knownLitarals);
        return knownLitarals;
    }

    getTypeAtPath(path: JSONPathNormalizedPath): DataType {
        let current = this as DataType;
        for (const pathSegment of path) {
            current = current.getTypeAtPathSegment(pathSegment);
        }
        return current;
    }

    abstract changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: DataType) => DataType): DataType;
    abstract setPathExistence(path: JSONPathNormalizedPath): DataType;
    abstract toStringInternal(simplified: boolean, multiline: boolean, level: number): string;
    
    toString(simplified = false, multiline = false): string {
        return this.toStringInternal(simplified, multiline, 0);
    }

    protected createIndentationString(level: number): string {
        const INDENTATION_SIZE = 2;
        return " ".repeat(INDENTATION_SIZE * level);
    }

    protected coerceMultiline(strings: string[], multiline: boolean): boolean {
        const MAX_STRING_LENGTH = 30;
        const MAX_STRING_COUNT = 3;
        if (!multiline) return multiline;
        if (strings.length > MAX_STRING_COUNT) return multiline;
        if (!strings.every(s => s.length <= MAX_STRING_LENGTH && s.indexOf("\n") === -1)) return multiline;
        return false;
    }
}

export enum PrimitiveDataTypeType {
    number = "number",
    string = "string",
    boolean = "boolean",
    null = "null",
    nothing = "nothing"
}

export class LiteralDataType extends DataType {
    private constructor(
        readonly value: string | number | boolean,
        annotations: ReadonlySet<DataTypeAnnotation>
    ) {
        super(annotations);
    }

    static create(value: string | number | boolean, annotations = DataTypeAnnotation.EMPTY_SET): LiteralDataType {
        return new LiteralDataType(value, annotations);
    }

    get type(): PrimitiveDataTypeType {
        if (typeof this.value === "number")
            return PrimitiveDataTypeType.number;
        else if (typeof this.value === "string")
            return PrimitiveDataTypeType.string;
        else if (typeof this.value === "boolean")
            return PrimitiveDataTypeType.boolean;
        else
            throw new Error("Unknown literal type.");
    }

    withAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType {
        return new LiteralDataType(this.value, annotations);
    }

    getChildrenType(): DataType {
        return NeverDataType.create();
    }

    getDescendantType(): DataType {
        return NeverDataType.create();
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        return;
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        literals.add(this.value);
    }

    getTypeAtPathSegment(segment: string | number): DataType {
        return NeverDataType.create();
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        return JSON.stringify(this.value);
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: JSONPathNormalizedPath): DataType {
        return path.length === 0 ? this : NeverDataType.create();
    }
}

export class PrimitiveDataType extends DataType {
    private constructor(
        readonly type: PrimitiveDataTypeType,
        annotations: ReadonlySet<DataTypeAnnotation>
    ) {
        super(annotations);
    }

    static create(type: PrimitiveDataTypeType, annotations = DataTypeAnnotation.EMPTY_SET): PrimitiveDataType {
        return new PrimitiveDataType(type, annotations);
    }

    withAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType {
        return new PrimitiveDataType(this.type, annotations);
    }

    getChildrenType(): DataType {
        return NeverDataType.create();
    }

    getDescendantType(): DataType {
        return NeverDataType.create();
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        return;
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        if (this.type === PrimitiveDataTypeType.null)
            literals.add(null);
        else if (this.type === PrimitiveDataTypeType.boolean) {
            literals.add(false);
            literals.add(true);
        }
    }

    getTypeAtPathSegment(segment: string | number): DataType {
        return NeverDataType.create();
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        return this.type;
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: JSONPathNormalizedPath): DataType {
        return path.length === 0 ? this : NeverDataType.create();
    }
}

export class ObjectDataType extends DataType {
    private constructor(
        readonly propertyTypes: ReadonlyMap<string, DataType>,
        readonly restPropertyType: DataType,
        readonly requiredProperties: ReadonlySet<string>,
        annotations: ReadonlySet<DataTypeAnnotation>
    ) {
        super(annotations);
    }

    static create(propertyTypes: ReadonlyMap<string, DataType>, restPropertyType: DataType, requiredProperties: ReadonlySet<string>, annotations = DataTypeAnnotation.EMPTY_SET): ObjectDataType | NeverDataType {
        const isSomeRequiredPropertyNever = propertyTypes.entries().some(([name, type]) => type instanceof NeverDataType && requiredProperties.has(name));
        if (isSomeRequiredPropertyNever)
            return NeverDataType.create();

        return new ObjectDataType(propertyTypes, restPropertyType, requiredProperties, annotations);
    }

    withAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType {
        return new ObjectDataType(this.propertyTypes, this.restPropertyType, this.requiredProperties, annotations);
    }

    getChildrenType(): DataType {
        return UnionDataType.create([...this.propertyTypes.values(), this.restPropertyType]);
    }

    getDescendantType(): DataType {
        const childrenType = this.getChildrenType();
        return UnionDataType.create([childrenType, childrenType.getDescendantType()]);
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        for (const propertyName of this.propertyTypes.keys())
            pathSegments.add(propertyName);
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        return;
    }

    getTypeAtPathSegment(segment: string | number): DataType {
        if (typeof segment === "number")
            return NeverDataType.create();

        let type = this.propertyTypes.get(segment);
        if (type === undefined)
            type = this.restPropertyType;
        return type;
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        if (simplified) 
            return "object";
        const propertyTypeStrings = this.propertyTypes.entries().map(([propertyName, propertyType]) => `${propertyName}${this.requiredProperties.has(propertyName) ? "" : "?"}: ${propertyType.toStringInternal(simplified, multiline, level + 1)}`).toArray();
        if (!(this.restPropertyType instanceof NeverDataType))
            propertyTypeStrings.push(`...: ${this.restPropertyType.toStringInternal(simplified, multiline, level + 1)}`);

        multiline = this.coerceMultiline(propertyTypeStrings, multiline);
        let text = "{";
        if (multiline) text += "\n" + this.createIndentationString(level + 1);
        else text += " ";
        text += propertyTypeStrings.join(multiline ? ",\n" + this.createIndentationString(level + 1) : ", ");
        if (multiline) text += "\n" + this.createIndentationString(level);
        else text += " ";
        text += "}";
        return text;
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        if (path.length === 0)
            return operation(this)
        if (typeof path[0] === "number" || !this.propertyTypes.has(path[0]))
            return this;

        const newPropertyTypes = new Map(this.propertyTypes);
        newPropertyTypes.set(path[0], newPropertyTypes.get(path[0])!.changeTypeAtPath(path.slice(1), operation));
        return ObjectDataType.create(newPropertyTypes, this.restPropertyType, this.requiredProperties);
    }

    setPathExistence(path: JSONPathNormalizedPath): DataType {
        if (path.length === 0)
            return this;
        if (typeof path[0] === "number")
            return NeverDataType.create();
        const newRequiredProperties = new Set(this.requiredProperties);
        newRequiredProperties.add(path[0]);
        return ObjectDataType.create(this.propertyTypes, this.restPropertyType, newRequiredProperties);
    }
}

export class ArrayDataType extends DataType {
    private constructor(
        readonly prefixElementTypes: readonly DataType[],
        readonly restElementType: DataType,
        readonly requiredElementCount: number,
        annotations: ReadonlySet<DataTypeAnnotation>
    ) {
        super(annotations);
    }

    static create(prefixElementTypes: readonly DataType[], restElementType: DataType, requiredElementCount: number, annotations = DataTypeAnnotation.EMPTY_SET): ArrayDataType | NeverDataType {
        const isSomeRequiredElementNever = prefixElementTypes.some((type, i) => type instanceof NeverDataType && i < requiredElementCount);
        if (isSomeRequiredElementNever)
            return NeverDataType.create();
        return new ArrayDataType(prefixElementTypes, restElementType, requiredElementCount, annotations);
    }

    withAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType {
        return new ArrayDataType(this.prefixElementTypes, this.restElementType, this.requiredElementCount, annotations);
    }

    getChildrenType(): DataType {
        return UnionDataType.create([...this.prefixElementTypes, this.restElementType]);
    }

    getDescendantType(): DataType {
        const childrenType = this.getChildrenType();
        return UnionDataType.create([childrenType, childrenType.getDescendantType()]);
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        for (let i = 0; i < this.prefixElementTypes.length; i++)
            pathSegments.add(i);
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        return;
    }

    getTypeAtPathSegment(segment: string | number): DataType {
        if (typeof segment === "string")
            return NeverDataType.create();

        if (segment < 0) {
            const possibleTypes: DataType[] = [];
            for (const normalizedIndex of this.getAllPossibleNormalizedIndices(segment))
                possibleTypes.push(this.getTypeAtPathSegment(normalizedIndex));
            return UnionDataType.create(possibleTypes);
        }

        let type;
        if (segment < this.prefixElementTypes.length)
            type = this.prefixElementTypes[segment];
        else
            type = this.restElementType;
        return type;
    }

    private *getAllPossibleNormalizedIndices(segment: number) {
        // Loop through all possible positions of the last element.
        for (let normalizedIndex = this.restElementType instanceof NeverDataType ? this.prefixElementTypes.length + segment : this.prefixElementTypes.length; normalizedIndex >= 0; normalizedIndex--) {
            const impliedArrayLength = normalizedIndex - segment;
            if (impliedArrayLength < this.requiredElementCount) 
                return;
            if (this.getTypeAtPathSegment(impliedArrayLength - 1) instanceof NeverDataType)
                continue;
            else
                yield normalizedIndex;
        }
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        if (simplified)
            return "array";
        const elementTypeStrings = this.prefixElementTypes.map(t => t.toStringInternal(simplified, multiline, level + 1));
        if (!(this.restElementType instanceof NeverDataType))
            elementTypeStrings.push(`...: ${this.restElementType.toStringInternal(simplified, multiline, level + 1)}`);

        multiline = this.coerceMultiline(elementTypeStrings, multiline);
        let text = "[";
        if (multiline) text += "\n" + this.createIndentationString(level + 1);
        text += elementTypeStrings.join(multiline ? ",\n" + this.createIndentationString(level + 1) : ", ");
        if (multiline) text += "\n" + this.createIndentationString(level);
        text += "]";
        return text;
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        if (path.length === 0)
            return operation(this);
        if (typeof path[0] === "string" || path[0] >= this.prefixElementTypes.length)
            return this;

        const newPrefixElementTypes = [...this.prefixElementTypes];
        newPrefixElementTypes[path[0]] = newPrefixElementTypes[path[0]].changeTypeAtPath(path.slice(1), operation);
        return ArrayDataType.create(newPrefixElementTypes, this.restElementType, this.requiredElementCount);
    }

    setPathExistence(path: JSONPathNormalizedPath): DataType {
        if (path.length === 0)
            return this;
        if (typeof path[0] === "string")
            return NeverDataType.create();
        const newRequiredElementCount = Math.max(this.requiredElementCount, path[0] + 1);
        return ArrayDataType.create(this.prefixElementTypes, this.restElementType, newRequiredElementCount);
    }
}

export class UnionDataType extends DataType {
    private constructor(
        readonly types: readonly DataType[],
        annotations: ReadonlySet<DataTypeAnnotation>
    ) {
        super(annotations);
    }

    static create(types: readonly DataType[], annotations = DataTypeAnnotation.EMPTY_SET): DataType {
        const flattenedTypes = types.flatMap(type => {
            if (type instanceof UnionDataType)
                return type.types.map(t => t.addAnnotations(type.annotations));
            else
                return [type];
        });
        for (let i = 0; i < flattenedTypes.length; i++) {
            for (let j = i + 1; j < flattenedTypes.length; j++) {
                const typeI = flattenedTypes[i];
                const typeJ = flattenedTypes[j];
                const isISubtypeOfJ = isSubtypeOf(typeI, typeJ);
                const isJSubtypeOfI = isSubtypeOf(typeJ, typeI);
                const areEquivalent = isISubtypeOfJ && isJSubtypeOfI;
                if (areEquivalent) {
                    flattenedTypes[i] = NeverDataType.create();
                    flattenedTypes[j] = typeJ.addAnnotations(typeI.annotations);
                }
                else if (isISubtypeOfJ)
                    flattenedTypes[i] = NeverDataType.create();
                else if (isJSubtypeOfI)
                    flattenedTypes[j] = NeverDataType.create();
            }
        }
        const filteredFlattenedTypes = flattenedTypes.filter(type => !(type instanceof NeverDataType));
        if (filteredFlattenedTypes.length === 0)
            return NeverDataType.create();
        else if (filteredFlattenedTypes.length === 1)
            return filteredFlattenedTypes[0].addAnnotations(annotations);
        else
            return new UnionDataType(filteredFlattenedTypes, annotations);
    }

    withAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType {
        return new UnionDataType(this.types, annotations);
    }

    collectAnnotationsToSet(annotations: Set<DataTypeAnnotation>) {
        super.collectAnnotationsToSet(annotations);
        for (const type of this.types)
            type.collectAnnotationsToSet(annotations);
    }

    getChildrenType(): DataType {
        const childrenTypes = this.types.map(type => type.getChildrenType());
        return UnionDataType.create(childrenTypes);
    }

    getDescendantType(): DataType {
        const descendantTypes = this.types.map(type => type.getDescendantType());
        return UnionDataType.create(descendantTypes);
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        for (const type of this.types)
            type.collectKnownPathSegmentsToSet(pathSegments);
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        for (const type of this.types)
            type.collectKnownLiteralsToSet(literals);
    }

    getTypeAtPathSegment(segment: string | number): DataType {
        const types = this.types.map(type => type.getTypeAtPathSegment(segment));
        return UnionDataType.create(types);
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        const typeStrings = this.types.map(t => t.toStringInternal(simplified, multiline, level + 1));
        multiline = this.coerceMultiline(typeStrings, multiline);
        return `${typeStrings.join(multiline ? " |\n" + this.createIndentationString(level + 1) : " | ")}`;
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        const newTypes = this.types.map(t => t.changeTypeAtPath(path, operation));
        return UnionDataType.create(newTypes);
    }

    setPathExistence(path: JSONPathNormalizedPath): DataType {
        const newTypes = this.types.map(t => t.setPathExistence(path));
        return UnionDataType.create(newTypes);
    }
}

export class NeverDataType extends DataType {
    private static readonly instance: NeverDataType = new NeverDataType(DataTypeAnnotation.EMPTY_SET);

    private constructor(
        annotations: ReadonlySet<DataTypeAnnotation>
    ) {
        super(annotations);
    }

    static create(annotations = DataTypeAnnotation.EMPTY_SET): NeverDataType {
        if (annotations.size === 0)
            return NeverDataType.instance;
        else
            return new NeverDataType(annotations);
    }

    withAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType {
        return new NeverDataType(annotations);
    }

    getChildrenType(): DataType {
        return NeverDataType.create();
    }

    getDescendantType(): DataType {
        return NeverDataType.create();
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        return;
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        return;
    }

    getTypeAtPathSegment(segment: string | number): DataType {
        return NeverDataType.create();
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        return "never";
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: JSONPathNormalizedPath): DataType {
        return this;
    }
}

export class AnyDataType extends DataType {
    private static readonly instance: AnyDataType = new AnyDataType();

    private constructor(
        annotations: ReadonlySet<DataTypeAnnotation> = DataTypeAnnotation.EMPTY_SET
    ) {
        super(annotations);
    }

    static create(annotations = DataTypeAnnotation.EMPTY_SET): AnyDataType {
        if (annotations.size === 0)
            return AnyDataType.instance;
        else
            return new AnyDataType(annotations);
    }

    withAnnotations(annotations: ReadonlySet<DataTypeAnnotation>): DataType {
        return new AnyDataType(annotations);
    }

    getChildrenType(): DataType {
        return AnyDataType.create();
    }

    getDescendantType(): DataType {
        return AnyDataType.create();
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        return;
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        return;
    }

    getTypeAtPathSegment(segment: string | number): DataType {
        return AnyDataType.create();
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        return "any";
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: JSONPathNormalizedPath): DataType {
        return this;
    }
}

export function intersectTypes(typeA: DataType, typeB: DataType): DataType {
    if (typeA instanceof UnionDataType)
        return UnionDataType.create(typeA.types.map(type => intersectTypes(type, typeB)), typeA.annotations);
    if (typeB instanceof UnionDataType)
        return UnionDataType.create(typeB.types.map(type => intersectTypes(typeA, type)), typeB.annotations);

    if (isSubtypeOf(typeA, typeB))
        return typeA.addAnnotations(typeB.annotations);
    if (isSubtypeOf(typeB, typeA))
        return typeB.addAnnotations(typeA.annotations);

    if (typeA instanceof ObjectDataType && typeB instanceof ObjectDataType) {
        const propertyNames = new Set([...typeA.propertyTypes.keys(), ...typeB.propertyTypes.keys()]);
        const intersectedPropertyTypes = new Map<string, DataType>();
        for (const propertyName of propertyNames) {
            const propertyTypeA = typeA.getTypeAtPathSegment(propertyName);
            const propertyTypeB = typeB.getTypeAtPathSegment(propertyName);
            const intersectedPropertyType = intersectTypes(propertyTypeA, propertyTypeB);
            intersectedPropertyTypes.set(propertyName, intersectedPropertyType);
        }
        const intersectedRestPropertyType = intersectTypes(typeA.restPropertyType, typeB.restPropertyType);
        const intersectedRequiredProperties = typeA.requiredProperties.union(typeB.requiredProperties);
        const intersectedAnnotations = typeA.annotations.union(typeB.annotations);
        return ObjectDataType.create(intersectedPropertyTypes, intersectedRestPropertyType, intersectedRequiredProperties, intersectedAnnotations);
    }
    if (typeA instanceof ArrayDataType && typeB instanceof ArrayDataType) {
        const prefixElementTypes: DataType[] = [];
        for (let i = 0; i < Math.max(typeA.prefixElementTypes.length, typeB.prefixElementTypes.length); i++) {
            const intersectedPrefixElementType = intersectTypes(typeA.prefixElementTypes[i], typeB.prefixElementTypes[i]);
            prefixElementTypes.push(intersectedPrefixElementType);
        }
        const restElementType = intersectTypes(typeA.restElementType, typeB.restElementType);
        const intersectedRequiredElementCount = Math.max(typeA.requiredElementCount, typeB.requiredElementCount);
        const intersectedAnnotations = typeA.annotations.union(typeB.annotations);
        return ArrayDataType.create(prefixElementTypes, restElementType, intersectedRequiredElementCount, intersectedAnnotations);
    }
    return NeverDataType.create();
}

export function subtractTypes(typeA: DataType, typeB: DataType): DataType {
    if (typeA instanceof UnionDataType) {
        const newTypes = typeA.types.map(type => subtractTypes(type, typeB))
        return UnionDataType.create(newTypes, typeA.annotations);
    }
    if (typeB instanceof UnionDataType) {
        const newTypes = typeB.types.map(type => subtractTypes(typeA, type))
        return UnionDataType.create(newTypes, typeB.annotations);
    }
    if (isSubtypeOf(typeA, typeB))
        return NeverDataType.create();

    return typeA;
}

export function isSubtypeOf(typeA: DataType, typeB: DataType): boolean {
    if (typeA === typeB)
        return true;
    if (typeB instanceof AnyDataType)
        return true;
    if (typeB instanceof UnionDataType)
        return typeB.types.some(type => isSubtypeOf(typeA, type));

    if (typeA instanceof LiteralDataType)
        return typeB instanceof LiteralDataType && typeA.value === typeB.value || typeB instanceof PrimitiveDataType && typeA.type === typeB.type;
    if (typeA instanceof PrimitiveDataType)
        return typeB instanceof PrimitiveDataType && typeA.type === typeB.type;
    if (typeA instanceof ObjectDataType) {
        if (typeB instanceof ObjectDataType) {
            const propertyNames = new Set([...typeA.propertyTypes.keys(), ...typeB.propertyTypes.keys()]);
            for (const propertyName of propertyNames) {
                if (!isSubtypeOf(typeA.getTypeAtPathSegment(propertyName), typeB.getTypeAtPathSegment(propertyName)))
                    return false;
            }
            if (!isSubtypeOf(typeA.restPropertyType, typeB.restPropertyType))
                return false;
            if (!typeA.requiredProperties.isSupersetOf(typeB.requiredProperties))
                return false;
            return true;
        }
        else
            return false;
    }
    if (typeA instanceof ArrayDataType) {
        if (typeB instanceof ArrayDataType) {
            for (let i = 0; i < Math.max(typeA.prefixElementTypes.length, typeB.prefixElementTypes.length); i++) {
                if (!isSubtypeOf(typeA.getTypeAtPathSegment(i), typeB.getTypeAtPathSegment(i)))
                    return false;
            }
            if (!isSubtypeOf(typeA.restElementType, typeB.restElementType))
                return false;
            if (!(typeA.requiredElementCount >= typeB.requiredElementCount))
                return false;
            return true;
        }
    }
    if (typeA instanceof NeverDataType)
        return true;
    if (typeA instanceof UnionDataType)
        return typeA.types.every(type => isSubtypeOf(type, typeB));
    return false;
}

export function isEquvivalentTypeWith(typeA: DataType, typeB: DataType): boolean {
    return isSubtypeOf(typeA, typeB) && isSubtypeOf(typeB, typeA);
}
