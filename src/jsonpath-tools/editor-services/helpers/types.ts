import { JSONPathJSONValue, JSONPathNothing } from "@/jsonpath-tools/types";
import { JSONPathNormalizedPath } from "../../transformations";

export enum TypeUsageContext {
    expression,
    query
}

export class TypeAnnotation {
    constructor(
        readonly title: string,
        readonly description: string,
        readonly deprecated: boolean,
        readonly readOnly: boolean,
        readonly writeOnly: boolean,
        readonly defaultValue: JSONPathJSONValue | undefined,
        readonly exampleValues: readonly JSONPathJSONValue[]
    ) { }

    static readonly EMPTY_SET: ReadonlySet<TypeAnnotation> = new Set<TypeAnnotation>();
}

export abstract class Type {
    constructor(
        readonly annotations: ReadonlySet<TypeAnnotation>
    ) { }

    abstract withAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type;

    addAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type {
        if (annotations.size === 0) 
            return this;
        const newAnnotations = this.annotations.union(annotations);
        return this.withAnnotations(newAnnotations);
    }

    collectAnnotationsToSet(annotations: Set<TypeAnnotation>) {
        for (const annotation of this.annotations)
            annotations.add(annotation);
    }

    collectAnnotations(): Set<TypeAnnotation> {
        const annotations = new Set<TypeAnnotation>();
        this.collectAnnotationsToSet(annotations);
        return annotations;
    }

    abstract getChildrenType(): Type;
    abstract collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void;
    abstract getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type;

    collectKnownPathSegments(): Set<string | number> {
        const knownPathSegments = new Set<string | number>();
        this.collectKnownPathSegmentsToSet(knownPathSegments);
        return knownPathSegments;
    }

    getTypeAtPath(path: JSONPathNormalizedPath, usageContext: TypeUsageContext): Type {
        let current = this as Type;
        for (const pathSegment of path) {
            current = current.getTypeAtPathSegment(pathSegment, usageContext);
        }
        return current;
    }

    abstract changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: Type) => Type): Type;
    abstract setPathExistence(path: JSONPathNormalizedPath): Type;
}

export enum PrimitiveTypeType {
    number = "number",
    string = "string",
    boolean = "boolean",
    null = "null",
    nothing = "nothing"
}

export class LiteralType extends Type {
    private constructor(
        readonly value: string | number | boolean,
        annotations: ReadonlySet<TypeAnnotation>
    ) {
        super(annotations);
    }

    static create(value: string | number | boolean, annotations = TypeAnnotation.EMPTY_SET): LiteralType {
        return new LiteralType(value, annotations);
    }

    get type(): PrimitiveTypeType {
        if (typeof this.value === "number")
            return PrimitiveTypeType.number;
        else if (typeof this.value === "string")
            return PrimitiveTypeType.string;
        else if (typeof this.value === "boolean")
            return PrimitiveTypeType.boolean;
        else
            throw new Error("Unknown literal type.");
    }

    withAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type {
        return new LiteralType(this.value, annotations);
    }

    getChildrenType(): Type {
        return NeverType.create();
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        return;
    }

    getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type {
        if (usageContext === TypeUsageContext.query)
            return NeverType.create();
        else
            return PrimitiveType.create(PrimitiveTypeType.nothing);
    }

    toString(): string {
        return JSON.stringify(this.value);
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: Type) => Type): Type {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: JSONPathNormalizedPath): Type {
        return path.length === 0 ? this : NeverType.create();
    }
}

export class PrimitiveType extends Type {
    private constructor(
        readonly type: PrimitiveTypeType,
        annotations: ReadonlySet<TypeAnnotation>
    ) {
        super(annotations);
    }

    static create(type: PrimitiveTypeType, annotations = TypeAnnotation.EMPTY_SET): PrimitiveType {
        return new PrimitiveType(type, annotations);
    }

    withAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type {
        return new PrimitiveType(this.type, annotations);
    }

    getChildrenType(): Type {
        return NeverType.create();
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        return;
    }

    getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type {
        if (usageContext === TypeUsageContext.query)
            return NeverType.create();
        else
            return PrimitiveType.create(PrimitiveTypeType.nothing);
    }

    toString(): string {
        return this.type;
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: Type) => Type): Type {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: JSONPathNormalizedPath): Type {
        return path.length === 0 ? this : NeverType.create();
    }
}

export class ObjectType extends Type {
    private constructor(
        readonly propertyTypes: ReadonlyMap<string, Type>,
        readonly restPropertyType: Type,
        readonly requiredProperties: ReadonlySet<string>,
        annotations: ReadonlySet<TypeAnnotation>
    ) {
        super(annotations);
    }

    static create(propertyTypes: ReadonlyMap<string, Type>, restPropertyType: Type, requiredProperties: ReadonlySet<string>, annotations = TypeAnnotation.EMPTY_SET): ObjectType | NeverType {
        const isSomeRequiredPropertyNever = propertyTypes.entries().some(([name, type]) => type instanceof NeverType && requiredProperties.has(name));
        if (isSomeRequiredPropertyNever)
            return NeverType.create();

        return new ObjectType(propertyTypes, restPropertyType, requiredProperties, annotations);
    }

    withAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type {
        return new ObjectType(this.propertyTypes, this.restPropertyType, this.requiredProperties, annotations);
    }

    getChildrenType(): Type {
        return UnionType.create([...this.propertyTypes.values(), this.restPropertyType]);
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        for (const propertyName of this.propertyTypes.keys())
            pathSegments.add(propertyName);
    }

    getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type {
        if (typeof segment === "number")
            return usageContext === TypeUsageContext.query ? NeverType.create() : PrimitiveType.create(PrimitiveTypeType.nothing);

        let type = this.propertyTypes.get(segment);
        if (type === undefined)
            type = this.restPropertyType;

        if (!this.requiredProperties.has(segment) && usageContext === TypeUsageContext.expression)
            type = UnionType.create([type, PrimitiveType.create(PrimitiveTypeType.nothing)]);
        return type;
    }

    toString(): string {
        const propertyTypeStrings = [...this.propertyTypes].map(([propertyName, propertyType]) => `${propertyName}${this.requiredProperties.has(propertyName) ? "" : "?"}: ${propertyType}`);
        return `{${propertyTypeStrings.join(", ")}, ...: ${this.restPropertyType}}`;
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: Type) => Type): Type {
        if (path.length === 0)
            return operation(this)
        if (typeof path[0] === "number" || !this.propertyTypes.has(path[0]))
            return this;

        const newPropertyTypes = new Map(this.propertyTypes);
        newPropertyTypes.set(path[0], newPropertyTypes.get(path[0])!.changeTypeAtPath(path.slice(1), operation));
        return ObjectType.create(newPropertyTypes, this.restPropertyType, this.requiredProperties);
    }

    setPathExistence(path: JSONPathNormalizedPath): Type {
        if (path.length === 0)
            return this;
        if (typeof path[0] === "number")
            return NeverType.create();
        const newRequiredProperties = new Set(this.requiredProperties);
        newRequiredProperties.add(path[0]);
        return ObjectType.create(this.propertyTypes, this.restPropertyType, newRequiredProperties);
    }
}

export class ArrayType extends Type {
    private constructor(
        readonly prefixElementTypes: readonly Type[],
        readonly restElementType: Type,
        readonly requiredElementCount: number,
        annotations: ReadonlySet<TypeAnnotation>
    ) {
        super(annotations);
    }

    static create(prefixElementTypes: readonly Type[], restElementType: Type, requiredElementCount: number, annotations = TypeAnnotation.EMPTY_SET): ArrayType | NeverType {
        const isSomeRequiredElementNever = prefixElementTypes.some((type, i) => type instanceof NeverType && i < requiredElementCount);
        if (isSomeRequiredElementNever)
            return NeverType.create();
        return new ArrayType(prefixElementTypes, restElementType, requiredElementCount, annotations);
    }

    withAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type {
        return new ArrayType(this.prefixElementTypes, this.restElementType, this.requiredElementCount, annotations);
    }

    getChildrenType(): Type {
        return UnionType.create([...this.prefixElementTypes, this.restElementType]);
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        for (let i = 0; i < this.prefixElementTypes.length; i++)
            pathSegments.add(i);
    }

    getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type {
        if (typeof segment === "string")
            return usageContext === TypeUsageContext.query ? NeverType.create() : PrimitiveType.create(PrimitiveTypeType.nothing);

        let type;
        if (segment < this.prefixElementTypes.length)
            type = this.prefixElementTypes[segment];
        else
            type = this.restElementType;
        if (segment >= this.requiredElementCount && usageContext === TypeUsageContext.expression)
            type = UnionType.create([type, PrimitiveType.create(PrimitiveTypeType.nothing)]);
        return type;
    }

    toString(): string {
        return `[${this.prefixElementTypes.join(", ")}, ...: ${this.restElementType}]`;
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: Type) => Type): Type {
        if (path.length === 0)
            return operation(this);
        if (typeof path[0] === "string" || path[0] >= this.prefixElementTypes.length)
            return this;

        const newPrefixElementTypes = [...this.prefixElementTypes];
        newPrefixElementTypes[path[0]] = newPrefixElementTypes[path[0]].changeTypeAtPath(path.slice(1), operation);
        return ArrayType.create(newPrefixElementTypes, this.restElementType, this.requiredElementCount);
    }

    setPathExistence(path: JSONPathNormalizedPath): Type {
        if (path.length === 0)
            return this;
        if (typeof path[0] === "string")
            return NeverType.create();
        const newRequiredElementCount = Math.max(this.requiredElementCount, path[0] + 1);
        return ArrayType.create(this.prefixElementTypes, this.restElementType, newRequiredElementCount);
    }
}

export class UnionType extends Type {
    private constructor(
        readonly types: readonly Type[],
        annotations: ReadonlySet<TypeAnnotation>
    ) {
        super(annotations);
    }

    static create(types: readonly Type[], annotations = TypeAnnotation.EMPTY_SET): Type {
        const flattenedTypes = types.flatMap(type => {
            if (type instanceof UnionType)
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
                    flattenedTypes[i] = NeverType.create();
                    flattenedTypes[j] = typeJ.addAnnotations(typeI.annotations);
                }
                else if (isISubtypeOfJ)
                    flattenedTypes[i] = NeverType.create();
                else if (isJSubtypeOfI)
                    flattenedTypes[j] = NeverType.create();
            }
        }
        const filteredFlattenedTypes = flattenedTypes.filter(type => !(type instanceof NeverType));
        if (filteredFlattenedTypes.length === 0)
            return NeverType.create();
        else if (filteredFlattenedTypes.length === 1)
            return filteredFlattenedTypes[0].addAnnotations(annotations);
        else
            return new UnionType(filteredFlattenedTypes, annotations);
    }

    withAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type {
        return new UnionType(this.types, annotations);
    }

    collectAnnotationsToSet(annotations: Set<TypeAnnotation>) {
        super.collectAnnotationsToSet(annotations);
        for (const type of this.types)
            type.collectAnnotationsToSet(annotations);
    }

    getChildrenType(): Type {
        const childrenTypes = this.types.map(type => type.getChildrenType());
        return UnionType.create(childrenTypes);
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        for (const type of this.types)
            type.collectKnownPathSegmentsToSet(pathSegments);
    }

    getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type {
        const types = this.types.map(type => type.getTypeAtPathSegment(segment, usageContext));
        return UnionType.create(types);
    }

    toString(): string {
        return `(${this.types.join(" | ")})`;
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: Type) => Type): Type {
        const newTypes = this.types.map(t => t.changeTypeAtPath(path, operation));
        return UnionType.create(newTypes);
    }

    setPathExistence(path: JSONPathNormalizedPath): Type {
        const newTypes = this.types.map(t => t.setPathExistence(path));
        return UnionType.create(newTypes);
    }
}

export class NeverType extends Type {
    private static readonly instance: NeverType = new NeverType(TypeAnnotation.EMPTY_SET);

    private constructor(
        annotations: ReadonlySet<TypeAnnotation>
    ) {
        super(annotations);
    }

    static create(annotations = TypeAnnotation.EMPTY_SET): NeverType {
        if (annotations.size === 0)
            return NeverType.instance;
        else
            return new NeverType(annotations);
    }

    withAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type {
        return new NeverType(annotations);
    }

    getChildrenType(): Type {
        return NeverType.create();
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        return;
    }

    getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type {
        return NeverType.create();
    }

    toString(): string {
        return "never";
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: Type) => Type): Type {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: JSONPathNormalizedPath): Type {
        return this;
    }
}

export class AnyType extends Type {
    private static readonly instance: AnyType = new AnyType();

    private constructor(
        annotations: ReadonlySet<TypeAnnotation> = TypeAnnotation.EMPTY_SET
    ) {
        super(annotations);
    }

    static create(annotations = TypeAnnotation.EMPTY_SET): AnyType {
        if (annotations.size === 0)
            return AnyType.instance;
        else
            return new AnyType(annotations);
    }

    withAnnotations(annotations: ReadonlySet<TypeAnnotation>): Type {
        return new AnyType(annotations);
    }

    getChildrenType(): Type {
        return AnyType.create();
    }

    collectKnownPathSegmentsToSet(pathSegments: Set<string | number>): void {
        return;
    }

    getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type {
        return AnyType.create();
    }

    toString(): string {
        return "any";
    }

    changeTypeAtPath(path: JSONPathNormalizedPath, operation: (currentType: Type) => Type): Type {
        return path.length === 0 ? operation(this) : this;
    }

    setPathExistence(path: JSONPathNormalizedPath): Type {
        return this;
    }
}

export function intersectTypes(typeA: Type, typeB: Type): Type {
    if (typeA instanceof UnionType)
        return UnionType.create(typeA.types.map(type => intersectTypes(type, typeB)), typeA.annotations);
    if (typeB instanceof UnionType)
        return UnionType.create(typeB.types.map(type => intersectTypes(typeA, type)), typeB.annotations);

    if (isSubtypeOf(typeA, typeB))
        return typeA.addAnnotations(typeB.annotations);
    if (isSubtypeOf(typeB, typeA))
        return typeB.addAnnotations(typeA.annotations);

    if (typeA instanceof ObjectType && typeB instanceof ObjectType) {
        const propertyNames = new Set([...typeA.propertyTypes.keys(), ...typeB.propertyTypes.keys()]);
        const intersectedPropertyTypes = new Map<string, Type>();
        for (const propertyName of propertyNames) {
            const propertyTypeA = typeA.getTypeAtPathSegment(propertyName, TypeUsageContext.query);
            const propertyTypeB = typeB.getTypeAtPathSegment(propertyName, TypeUsageContext.query);
            const intersectedPropertyType = intersectTypes(propertyTypeA, propertyTypeB);
            intersectedPropertyTypes.set(propertyName, intersectedPropertyType);
        }
        const intersectedRestPropertyType = intersectTypes(typeA.restPropertyType, typeB.restPropertyType);
        const intersectedRequiredProperties = typeA.requiredProperties.union(typeB.requiredProperties);
        const intersectedAnnotations = typeA.annotations.union(typeB.annotations);
        return ObjectType.create(intersectedPropertyTypes, intersectedRestPropertyType, intersectedRequiredProperties, intersectedAnnotations);
    }
    if (typeA instanceof ArrayType && typeB instanceof ArrayType) {
        const prefixElementTypes: Type[] = [];
        for (let i = 0; i < Math.max(typeA.prefixElementTypes.length, typeB.prefixElementTypes.length); i++) {
            const intersectedPrefixElementType = intersectTypes(typeA.prefixElementTypes[i], typeB.prefixElementTypes[i]);
            prefixElementTypes.push(intersectedPrefixElementType);
        }
        const restElementType = intersectTypes(typeA.restElementType, typeB.restElementType);
        const intersectedRequiredElementCount = Math.max(typeA.requiredElementCount, typeB.requiredElementCount);
        const intersectedAnnotations = typeA.annotations.union(typeB.annotations);
        return ArrayType.create(prefixElementTypes, restElementType, intersectedRequiredElementCount, intersectedAnnotations);
    }
    return NeverType.create();
}

export function subtractTypes(typeA: Type, typeB: Type): Type {
    if (typeA instanceof UnionType) {
        const newTypes = typeA.types.map(type => subtractTypes(type, typeB))
        return UnionType.create(newTypes, typeA.annotations);
    }
    if (typeB instanceof UnionType) {
        const newTypes = typeB.types.map(type => subtractTypes(typeA, type))
        return UnionType.create(newTypes, typeB.annotations);
    }
    if (isSubtypeOf(typeA, typeB))
        return NeverType.create();

    return typeA;
}

export function isSubtypeOf(typeA: Type, typeB: Type): boolean {
    if (typeA === typeB)
        return true;
    if (typeB instanceof AnyType)
        return true;
    if (typeB instanceof UnionType)
        return typeB.types.some(type => isSubtypeOf(typeA, type));

    if (typeA instanceof LiteralType)
        return typeB instanceof LiteralType && typeA.value === typeB.value || typeB instanceof PrimitiveType && typeA.type === typeB.type;
    if (typeA instanceof PrimitiveType)
        return typeB instanceof PrimitiveType && typeA.type === typeB.type;
    if (typeA instanceof ObjectType) {
        if (typeB instanceof ObjectType) {
            const propertyNames = new Set([...typeA.propertyTypes.keys(), ...typeB.propertyTypes.keys()]);
            for (const propertyName of propertyNames) {
                if (!isSubtypeOf(typeA.getTypeAtPathSegment(propertyName, TypeUsageContext.query), typeB.getTypeAtPathSegment(propertyName, TypeUsageContext.query)))
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
    if (typeA instanceof ArrayType) {
        if (typeB instanceof ArrayType) {
            for (let i = 0; i < Math.max(typeA.prefixElementTypes.length, typeB.prefixElementTypes.length); i++) {
                if (!isSubtypeOf(typeA.getTypeAtPathSegment(i, TypeUsageContext.query), typeB.getTypeAtPathSegment(i, TypeUsageContext.query)))
                    return false;
            }
            if (!isSubtypeOf(typeA.restElementType, typeB.restElementType))
                return false;
            if (!(typeA.requiredElementCount >= typeB.requiredElementCount))
                return false;
            return true;
        }
    }
    if (typeA instanceof NeverType)
        return true;
    if (typeA instanceof UnionType)
        return typeA.types.every(type => isSubtypeOf(type, typeB));
    return false;
}

export function isEquvivalentTypeWith(typeA: Type, typeB: Type): boolean {
    return isSubtypeOf(typeA, typeB) && isSubtypeOf(typeB, typeA);
}

/*function hasOverlap(typeA: Type, typeB: Type): boolean {
    if (typeA instanceof AnyType) {
        return !(typeB instanceof NeverType);
    }
    if (typeB instanceof AnyType) {
        return !(typeA instanceof NeverType);
    }
    if (typeB instanceof UnionType) {
        return typeB.types.some(t => hasOverlap(typeA, t));
    }

    if (typeA instanceof LiteralType) {
        return typeB instanceof LiteralType && typeA.value === typeB.value || typeB instanceof PrimitiveType && typeA.type === typeB.type;
    }
    if (typeA instanceof PrimitiveType) {
        return typeB instanceof PrimitiveType && typeA.type === typeB.type || typeB instanceof LiteralType && typeA.type === typeB.type;
    }
    if (typeA instanceof ObjectType) {
        if (typeB instanceof ObjectType) {
            // TODO
        }
        else
            return false;
    }
    if (typeA instanceof ArrayType) {
        if (typeB instanceof ArrayType) {
            // TODO
        }
        else
            return false;
    }
    if (typeA instanceof UnionType) {
        return typeA.types.some(t => hasOverlap(t, typeB));
    }
    return false;
}*/

/*
function narrowTypeByExpression(type: Type, expression: JSONPathFilterExpression): Type {
    const booleanExpression = convertToBooleanExpression(expression);
    const disjuncts = booleanExpression.toDisjunctiveNormalForm();

    // 1. Convert the expression to a disjunctive normal form.
    // 2. For each disjunct, narrow the type.
    // 3. Union the narrowed types.
    // 4. Normalize the unioned type.
}

function narrowTypeByComparison(type: "les" | "pes") {
    if (type === "les" && type === "pes") {
        type
    }
}

function convertToBooleanExpression(expression: JSONPathFilterExpression): BooleanExpression {

}

abstract class BooleanExpression {
    abstract applyDemorgan(negate: boolean): BooleanExpression;
    abstract applyDistribute(): BooleanExpression;

    toDisjunctiveNormalForm(): ComparisonExpression[][] {
        
    }
}

class AndExpression extends BooleanExpression {
    constructor(
        readonly left: BooleanExpression,
        readonly right: BooleanExpression
    ) {
        super();
    }

    applyDemorgan(negate: boolean): BooleanExpression {
        const newLeft = this.left.applyDemorgan(negate);
        const newRight = this.right.applyDemorgan(negate);
        if (negate)
            return new OrExpression(newLeft, newRight);
        else
            return new AndExpression(newLeft, newRight);
    }

    applyDistribute(): BooleanExpression {
        const newLeft = this.left.applyDistribute();
        const newRight = this.right.applyDistribute();
        if (newLeft instanceof OrExpression)
            return new OrExpression(new AndExpression(newLeft.left, newRight).applyDistribute(), new AndExpression(newLeft.right, newRight).applyDistribute());
        else if (newRight instanceof OrExpression)
            return new OrExpression(new AndExpression(newLeft, newRight.left).applyDistribute(), new AndExpression(newLeft, newRight.right).applyDistribute());
        else
            return new AndExpression(newLeft, newRight);
    }
}

class OrExpression extends BooleanExpression {
    constructor(
        readonly left: BooleanExpression,
        readonly right: BooleanExpression
    ) {
        super();
    }

    applyDemorgan(negate: boolean): BooleanExpression {
        const newLeft = this.left.applyDemorgan(negate);
        const newRight = this.right.applyDemorgan(negate);
        if (negate)
            return new AndExpression(newLeft, newRight);
        else
            return new OrExpression(newLeft, newRight);
    }

    applyDistribute(): BooleanExpression {
        const newLeft = this.left.applyDistribute();
        const newRight = this.right.applyDistribute();
        return new OrExpression(newLeft, newRight);
    }
}

class NotExpression extends BooleanExpression {
    constructor(
        readonly expression: BooleanExpression
    ) {
        super();
    }

    applyDemorgan(negate: boolean): BooleanExpression {
        return this.expression.applyDemorgan(!negate);
    }

    applyDistribute(): BooleanExpression {
        const newExpression = this.expression.applyDistribute();
        return new NotExpression(newExpression);
    }
}

class ComparisonExpression extends BooleanExpression {
    constructor(
        readonly left: ValueExpression,
        readonly right: ValueExpression,
        readonly operator: "!=" | "==" | "<" | ">" | "<=" | ">="
    ) {
        super();
    }

    applyDemorgan(negate: boolean): BooleanExpression {
        if (negate) {
            if (this.operator === "==")
                return new ComparisonExpression(this.left, this.right, "!=");
            else if (this.operator === "!=")
                return new ComparisonExpression(this.left, this.right, "==");
            else 
                return new NotExpression(this);
        }
        else
            return this;
    }

    applyDistribute(): BooleanExpression {
        return this;
    }
}

abstract class ValueExpression {

}

class MemberAccessExpression extends ValueExpression {
    constructor(
        readonly path: JSONPathNormalizedPath
    ) {
        super();
    }
}

class StringLiteralExpression extends ValueExpression {
    constructor(
        readonly value: string
    ) {
        super();
    }
}

class NumberLiteralExpression extends ValueExpression {
    constructor(
        readonly value: number
    ) {
        super();
    }
}

class BooleanLiteralExpression extends ValueExpression {
    constructor(
        readonly value: boolean
    ) {
        super();
    }
}

class NullLiteralExpression extends ValueExpression {
    constructor() {
        super();
    }
}*/