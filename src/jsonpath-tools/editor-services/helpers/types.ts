import { JSONPathNothing } from "@/jsonpath-tools/types";
import { JSONPathNormalizedPath } from "../../transformations";

export enum TypeUsageContext {
    expression,
    query
}

export abstract class Type {
    abstract getChildrenType(): Type;
    abstract getTypeAtPathSegment(segment: string | number, usageContext: TypeUsageContext): Type;

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
        readonly value: string | number | boolean
    ) {
        super();
    }

    static create(value: string | number | boolean): LiteralType {
        return new LiteralType(value);
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

    getChildrenType(): Type {
        return NeverType.create();
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
        readonly type: PrimitiveTypeType
    ) {
        super();
    }

    static create(type: PrimitiveTypeType): PrimitiveType {
        return new PrimitiveType(type);
    }

    getChildrenType(): Type {
        return NeverType.create();
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
        readonly requiredProperties: ReadonlySet<string>
    ) {
        super();
    }

    static create(propertyTypes: ReadonlyMap<string, Type>, restPropertyType: Type, requiredProperties: ReadonlySet<string>): ObjectType | NeverType {
        const isSomeRequiredPropertyNever = propertyTypes.entries().some(([name, type]) => type instanceof NeverType && requiredProperties.has(name));
        if (isSomeRequiredPropertyNever)
            return NeverType.create();

        return new ObjectType(propertyTypes, restPropertyType, requiredProperties);
    }

    getChildrenType(): Type {
        return UnionType.create([...this.propertyTypes.values(), this.restPropertyType]);
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
        readonly requiredElementCount: number
    ) {
        super();
    }

    static create(prefixElementTypes: readonly Type[], restElementType: Type, requiredElementCount: number): ArrayType | NeverType {
        const isSomeRequiredElementNever = prefixElementTypes.some((type, i) => type instanceof NeverType && i < requiredElementCount);
        if (isSomeRequiredElementNever)
            return NeverType.create();
        return new ArrayType(prefixElementTypes, restElementType, requiredElementCount);
    }

    getChildrenType(): Type {
        return UnionType.create([...this.prefixElementTypes, this.restElementType]);
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
        readonly types: readonly Type[]
    ) {
        super();
    }

    static create(types: readonly Type[]): Type {
        const flattenedTypes = types.flatMap(type => {
            if (type instanceof UnionType)
                return type.types;
            else
                return [type];
        });
        for (let i = 0; i < flattenedTypes.length; i++) {
            for (let j = 0; j < flattenedTypes.length; j++) {
                if (i == j) continue;
                const typeA = flattenedTypes[i];
                const typeB = flattenedTypes[j];
                if (isSubtypeOf(typeA, typeB))
                    flattenedTypes[i] = NeverType.create();
            }
        }
        const filteredFlattenedTypes = flattenedTypes.filter(type => !(type instanceof NeverType));
        if (filteredFlattenedTypes.length === 0)
            return NeverType.create();
        else if (filteredFlattenedTypes.length === 1)
            return filteredFlattenedTypes[0];
        else
            return new UnionType(filteredFlattenedTypes);
    }

    getChildrenType(): Type {
        const childrenTypes = this.types.map(type => type.getChildrenType());
        return UnionType.create(childrenTypes);
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
    private static readonly instance: NeverType = new NeverType();

    private constructor() {
        super();
    }

    static create(): NeverType {
        return NeverType.instance;
    }

    getChildrenType(): Type {
        return NeverType.create();
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

    private constructor() {
        super();
    }

    static create(): AnyType {
        return AnyType.instance;
    }

    getChildrenType(): Type {
        return AnyType.create();
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
        return UnionType.create(typeA.types.map(type => intersectTypes(type, typeB)));
    if (typeB instanceof UnionType)
        return UnionType.create(typeB.types.map(type => intersectTypes(typeA, type)));

    if (isSubtypeOf(typeA, typeB))
        return typeA;
    if (isSubtypeOf(typeB, typeA))
        return typeB;

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
        const intersectedRequiredProperties = typeA.requiredProperties.union(typeB.requiredProperties)
        return ObjectType.create(intersectedPropertyTypes, intersectedRestPropertyType, intersectedRequiredProperties);
    }
    if (typeA instanceof ArrayType && typeB instanceof ArrayType) {
        const prefixElementTypes: Type[] = [];
        for (let i = 0; i < Math.max(typeA.prefixElementTypes.length, typeB.prefixElementTypes.length); i++) {
            const intersectedPrefixElementType = intersectTypes(typeA.prefixElementTypes[i], typeB.prefixElementTypes[i]);
            prefixElementTypes.push(intersectedPrefixElementType);
        }
        const restElementType = intersectTypes(typeA.restElementType, typeB.restElementType);
        const intersectedRequiredElementCount = Math.max(typeA.requiredElementCount, typeB.requiredElementCount);
        return ArrayType.create(prefixElementTypes, restElementType, intersectedRequiredElementCount);
    }
    return NeverType.create();
}

export function subtractTypes(typeA: Type, typeB: Type): Type {
    if (typeA instanceof UnionType) {
        const newTypes = typeA.types.map(type => subtractTypes(type, typeB))
        return UnionType.create(newTypes);
    }
    if (typeB instanceof UnionType) {
        const newTypes = typeB.types.map(type => subtractTypes(typeA, type))
        return UnionType.create(newTypes);
    }
    if (isSubtypeOf(typeA, typeB))
        return NeverType.create();

    return typeA;
}

export function isSubtypeOf(typeA: Type, typeB: Type): boolean {
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