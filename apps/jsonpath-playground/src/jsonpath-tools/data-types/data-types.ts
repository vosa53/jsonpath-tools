import { JSONValue } from "../json/json-types";
import { NormalizedPath, NormalizedPathSegment } from "../normalized-path";
import { isSubtypeOf } from "./operations";

/**
 * Annotation of a data type (description, example values, ...).
 */
export class DataTypeAnnotation {
    constructor(
        /**
         * Title.
         */
        readonly title: string,

        /**
         * Description.
         */
        readonly description: string,

        /**
         * Whether it is deprecated.
         */
        readonly deprecated: boolean,

        /**
         * Whether it is read-only.
         */
        readonly readOnly: boolean,

        /**
         * Whether it is write-only.
         */
        readonly writeOnly: boolean,

        /**
         * Default value or `undefined` if no default value is defined.
         */
        readonly defaultValue: JSONValue | undefined,

        /**
         * Example of values.
         */
        readonly exampleValues: readonly JSONValue[]
    ) { }

    static readonly EMPTY_SET: ReadonlySet<DataTypeAnnotation> = new Set<DataTypeAnnotation>();
}

/**
 * Data type. Refines the JSONPath types.
 */
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
    abstract getTypeAtPathSegment(segment: NormalizedPathSegment): DataType;
    abstract collectKnownPathSegmentsToSet(pathSegments: Set<NormalizedPathSegment>): void;
    abstract collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void;

    collectKnownPathSegments(): Set<NormalizedPathSegment> {
        const knownPathSegments = new Set<NormalizedPathSegment>();
        this.collectKnownPathSegmentsToSet(knownPathSegments);
        return knownPathSegments;
    }

    collectKnownLiterals(): Set<string | number | boolean | null> {
        const knownLitarals = new Set<string | number | boolean | null>();
        this.collectKnownLiteralsToSet(knownLitarals);
        return knownLitarals;
    }

    getTypeAtPath(path: NormalizedPath): DataType {
        let current = this as DataType;
        for (const pathSegment of path) {
            current = current.getTypeAtPathSegment(pathSegment);
        }
        return current;
    }

    abstract changeTypeAtPath(path: NormalizedPath, operation: (currentType: DataType) => DataType): DataType;
    abstract setPathExistence(path: NormalizedPath): DataType;
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

/**
 * Type of a primitive data type.
 */
export enum PrimitiveDataTypeType {
    /**
     * JSON number.
     */
    number = "number",

    /**
     * JSON string.
     */
    string = "string",

    /**
     * JSON boolean.
     */
    boolean = "boolean",

    /**
     * JSON `null`.
     */
    null = "null",

    /**
     * JSONPath `Nothing`.
     */
    nothing = "nothing"
}

/**
 * Unit data type. Contains only the {@link value}.
 */
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

    collectKnownPathSegmentsToSet(pathSegments: Set<NormalizedPathSegment>): void {
        return;
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        literals.add(this.value);
    }

    getTypeAtPathSegment(segment: NormalizedPathSegment): DataType {
        return NeverDataType.create();
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        return JSON.stringify(this.value);
    }

    changeTypeAtPath(path: NormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: NormalizedPath): DataType {
        return path.length === 0 ? this : NeverDataType.create();
    }
}

/**
 * Data type for primitive JSON values and a special JSONPath value `Nothing`. Contains all values from {@link type}.
 */
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

    collectKnownPathSegmentsToSet(pathSegments: Set<NormalizedPathSegment>): void {
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

    getTypeAtPathSegment(segment: NormalizedPathSegment): DataType {
        return NeverDataType.create();
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        return this.type;
    }

    changeTypeAtPath(path: NormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: NormalizedPath): DataType {
        return path.length === 0 ? this : NeverDataType.create();
    }
}

/**
 * Data type for JSON objects. Contains all JSON objects that meet criteria from {@link propertyTypes}, {@link restPropertyType} and {@link requiredProperties}.
 */
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

    collectKnownPathSegmentsToSet(pathSegments: Set<NormalizedPathSegment>): void {
        for (const propertyName of this.propertyTypes.keys())
            pathSegments.add(propertyName);
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        return;
    }

    getTypeAtPathSegment(segment: NormalizedPathSegment): DataType {
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

    changeTypeAtPath(path: NormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        if (path.length === 0)
            return operation(this)
        if (typeof path[0] === "number" || !this.propertyTypes.has(path[0]))
            return this;

        const newPropertyTypes = new Map(this.propertyTypes);
        newPropertyTypes.set(path[0], newPropertyTypes.get(path[0])!.changeTypeAtPath(path.slice(1), operation));
        return ObjectDataType.create(newPropertyTypes, this.restPropertyType, this.requiredProperties);
    }

    setPathExistence(path: NormalizedPath): DataType {
        if (path.length === 0)
            return this;
        if (typeof path[0] === "number")
            return NeverDataType.create();
        const newRequiredProperties = new Set(this.requiredProperties);
        newRequiredProperties.add(path[0]);
        return ObjectDataType.create(this.propertyTypes, this.restPropertyType, newRequiredProperties);
    }
}

/**
 * Data type for JSON arrays. Contains all JSON arrays that meet criteria from {@link prefixElementTypes}, {@link restElementType} and {@link requiredElementCount}.
 */
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

    collectKnownPathSegmentsToSet(pathSegments: Set<NormalizedPathSegment>): void {
        for (let i = 0; i < this.prefixElementTypes.length; i++)
            pathSegments.add(i);
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        return;
    }

    getTypeAtPathSegment(segment: NormalizedPathSegment): DataType {
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

    changeTypeAtPath(path: NormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        if (path.length === 0)
            return operation(this);
        if (typeof path[0] === "string" || path[0] >= this.prefixElementTypes.length)
            return this;

        const newPrefixElementTypes = [...this.prefixElementTypes];
        newPrefixElementTypes[path[0]] = newPrefixElementTypes[path[0]].changeTypeAtPath(path.slice(1), operation);
        return ArrayDataType.create(newPrefixElementTypes, this.restElementType, this.requiredElementCount);
    }

    setPathExistence(path: NormalizedPath): DataType {
        if (path.length === 0)
            return this;
        if (typeof path[0] === "string")
            return NeverDataType.create();
        const newRequiredElementCount = Math.max(this.requiredElementCount, path[0] + 1);
        return ArrayDataType.create(this.prefixElementTypes, this.restElementType, newRequiredElementCount);
    }
}

/**
 * Sum data type. Contains values from an union of the {@link types}.
 */
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

    collectKnownPathSegmentsToSet(pathSegments: Set<NormalizedPathSegment>): void {
        for (const type of this.types)
            type.collectKnownPathSegmentsToSet(pathSegments);
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        for (const type of this.types)
            type.collectKnownLiteralsToSet(literals);
    }

    getTypeAtPathSegment(segment: NormalizedPathSegment): DataType {
        const types = this.types.map(type => type.getTypeAtPathSegment(segment));
        return UnionDataType.create(types);
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        const typeStrings = this.types.map(t => t.toStringInternal(simplified, multiline, level + 1));
        multiline = this.coerceMultiline(typeStrings, multiline);
        return `${typeStrings.join(multiline ? " |\n" + this.createIndentationString(level + 1) : " | ")}`;
    }

    changeTypeAtPath(path: NormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        const newTypes = this.types.map(t => t.changeTypeAtPath(path, operation));
        return UnionDataType.create(newTypes);
    }

    setPathExistence(path: NormalizedPath): DataType {
        const newTypes = this.types.map(t => t.setPathExistence(path));
        return UnionDataType.create(newTypes);
    }
}

/**
 * Bottom data type. Contains no values.
 */
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

    collectKnownPathSegmentsToSet(pathSegments: Set<NormalizedPathSegment>): void {
        return;
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        return;
    }

    getTypeAtPathSegment(segment: NormalizedPathSegment): DataType {
        return NeverDataType.create();
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        return "never";
    }

    changeTypeAtPath(path: NormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: NormalizedPath): DataType {
        return this;
    }
}

/**
 * Top data type. Contains all values.
 */
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

    collectKnownPathSegmentsToSet(pathSegments: Set<NormalizedPathSegment>): void {
        return;
    }

    collectKnownLiteralsToSet(literals: Set<string | number | boolean | null>): void {
        return;
    }

    getTypeAtPathSegment(segment: NormalizedPathSegment): DataType {
        return AnyDataType.create();
    }

    toStringInternal(simplified: boolean, multiline: boolean, level: number): string {
        return "any";
    }

    changeTypeAtPath(path: NormalizedPath, operation: (currentType: DataType) => DataType): DataType {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: NormalizedPath): DataType {
        return this;
    }
}
