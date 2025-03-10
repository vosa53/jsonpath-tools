import { JSONPathNormalizedPath } from "../../transformations";

export abstract class Type {
    abstract getChildrenType(): Type;
    abstract getTypeAtProperty(propertyName: string): Type;
    abstract getTypeAtIndex(index: number): Type;
    abstract simplify(): Type;

    getTypeAtPath(path: JSONPathNormalizedPath): Type {
        let current = this as Type;
        for (const pathSegment of path) {
            if (typeof pathSegment === "string")
                current = current.getTypeAtProperty(pathSegment);
            else
                current = current.getTypeAtIndex(pathSegment);
        }
        return current;
    }

    abstract setTypeAtPath(path: JSONPathNormalizedPath, type: Type): Type;
}

export enum PrimitiveTypeType {
    number = "number",
    string = "string",
    boolean = "boolean",
    null = "null"
}

export class LiteralType extends Type {
    constructor(
        readonly value: string | number | boolean
    ) {
        super();
    }

    get type(): PrimitiveTypeType {
        if (typeof this.value === "number")
            return PrimitiveTypeType.number;
        else if (typeof this.value === "string")
            return PrimitiveTypeType.string;
        else if (typeof this.value === "boolean")
            return PrimitiveTypeType.boolean;
        else
            return PrimitiveTypeType.null;
    }

    getChildrenType(): Type {
        return NeverType.instance;
    }

    getTypeAtProperty(propertyName: string): Type {
        return NeverType.instance;
    }

    getTypeAtIndex(index: number): Type {
        return NeverType.instance;
    }

    simplify(): Type {
        return this;
    }

    toString(): string {
        return JSON.stringify(this.value);
    }

    setTypeAtPath(path: JSONPathNormalizedPath, type: Type): Type {
        if (path.length === 0) return type;
        else return this;
    }
}

export class PrimitiveType extends Type {
    constructor(
        readonly type: PrimitiveTypeType
    ) {
        super();
    }

    getChildrenType(): Type {
        return NeverType.instance;
    }

    getTypeAtProperty(propertyName: string): Type {
        return NeverType.instance;
    }

    getTypeAtIndex(index: number): Type {
        return NeverType.instance;
    }

    simplify(): Type {
        return this;
    }

    toString(): string {
        return this.type;
    }

    setTypeAtPath(path: JSONPathNormalizedPath, type: Type): Type {
        if (path.length === 0) return type;
        else return this;
    }
} 

export class ObjectType extends Type {
    constructor(
        readonly propertyTypes: Map<string, Type>,
        readonly restPropertyType: Type,
        readonly requiredProperties: Set<string>
    ) {
        super();
    }

    getChildrenType(): Type {
        return new UnionType([...this.propertyTypes.values(), this.restPropertyType]).simplify();
    }

    getTypeAtProperty(propertyName: string): Type {
        const propertyType = this.propertyTypes.get(propertyName);
        if (propertyType !== undefined)
            return propertyType;
        else
            return this.restPropertyType;
    }

    getTypeAtIndex(index: number): Type {
        return NeverType.instance;
    }

    simplify(): Type {
        const simplifiedPropertyTypes = new Map<string, Type>();
        const simplifiedRestPropertyType = this.restPropertyType.simplify();
        for (const [propertyName, propertyType] of this.propertyTypes) {
            const simplifiedPropertyType = propertyType.simplify();
            simplifiedPropertyTypes.set(propertyName, simplifiedPropertyType);
            if (simplifiedPropertyType instanceof NeverType && this.requiredProperties.has(propertyName))
                return NeverType.instance;
        }
        return new ObjectType(simplifiedPropertyTypes, simplifiedRestPropertyType, this.requiredProperties);
    }

    toString(): string {
        const propertyTypeStrings = [...this.propertyTypes].map(([propertyName, propertyType]) => `${propertyName}${this.requiredProperties.has(propertyName) ? "" : "?"}: ${propertyType}`);
        return `{${propertyTypeStrings.join(", ")}, ...: ${this.restPropertyType}}`;
    }

    setTypeAtPath(path: JSONPathNormalizedPath, type: Type): Type {
        if (typeof path[0] === "number" || !this.propertyTypes.has(path[0]))
            return this;

        const newPropertyTypes = new Map(this.propertyTypes);
        newPropertyTypes.set(path[0], newPropertyTypes.get(path[0])!.setTypeAtPath(path.slice(1), type));
        return new ObjectType(newPropertyTypes, this.restPropertyType, this.requiredProperties).simplify();
    }
}

export class ArrayType extends Type {
    constructor(
        readonly prefixElementTypes: Type[],
        readonly restElementType: Type
    ) {
        super();
    }

    getChildrenType(): Type {
        return new UnionType([...this.prefixElementTypes, this.restElementType]).simplify();
    }

    getTypeAtProperty(propertyName: string): Type {
        return NeverType.instance;
    }

    getTypeAtIndex(index: number): Type {
        if (index < this.prefixElementTypes.length)
            return this.prefixElementTypes[index];
        else
            return this.restElementType;
    }

    simplify(): Type {
        const simplifiedPrefixElementTypes = this.prefixElementTypes.map(type => type.simplify());
        if (simplifiedPrefixElementTypes.some(spet => spet instanceof NeverType))
            return NeverType.instance;
        const simplifiedRestElementType = this.restElementType.simplify();
        return new ArrayType(simplifiedPrefixElementTypes, simplifiedRestElementType);
    }

    toString(): string {
        return `[${this.prefixElementTypes.join(", ")}, ...: ${this.restElementType}]`;
    }

    setTypeAtPath(path: JSONPathNormalizedPath, type: Type): Type {
        if (typeof path[0] === "string" || path[0] >= this.prefixElementTypes.length)
            return this;

        const newPrefixElementTypes = [...this.prefixElementTypes];
        newPrefixElementTypes[path[0]] = newPrefixElementTypes[path[0]].setTypeAtPath(path.slice(1), type);
        return new ArrayType(newPrefixElementTypes, this.restElementType).simplify();
    }
}

export class UnionType extends Type {
    constructor(
        readonly types: Type[]
    ) {
        super();
    }

    getChildrenType(): Type {
        const childrenTypes = this.types.map(type => type.getChildrenType());
        return new UnionType(childrenTypes).simplify();
    }

    getTypeAtProperty(propertyName: string): Type {
        const propertyTypes = this.types.map(type => type.getTypeAtProperty(propertyName));
        return new UnionType(propertyTypes).simplify();
    }

    getTypeAtIndex(index: number): Type {
        const indexTypes = this.types.map(type => type.getTypeAtIndex(index));
        return new UnionType(indexTypes).simplify();
    }

    simplify(): Type {
        const simplifiedTypes = this.types.map(type => type.simplify());
        const flattenedSimplifiedTypes = simplifiedTypes.flatMap(type => {
            if (type instanceof UnionType)
                return type.types;
            else
                return [type];
        });
        for (let i = 0; i < flattenedSimplifiedTypes.length; i++) {
            for (let j = 0; j < flattenedSimplifiedTypes.length; j++) {
                if (i == j) continue;
                const typeA = flattenedSimplifiedTypes[i];
                const typeB = flattenedSimplifiedTypes[j];
                if (isSubtypeOf(typeA, typeB))
                    flattenedSimplifiedTypes[i] = NeverType.instance;
            }
        }
        const filteredFlattenedSimplifiedTypes = flattenedSimplifiedTypes.filter(type => !(type instanceof NeverType));
        if (filteredFlattenedSimplifiedTypes.length === 0)
            return NeverType.instance;
        else if (filteredFlattenedSimplifiedTypes.length === 1)
            return filteredFlattenedSimplifiedTypes[0];
        else
            return new UnionType(filteredFlattenedSimplifiedTypes);
    }

    toString(): string {
        return `(${this.types.join(" | ")})`;
    }

    setTypeAtPath(path: JSONPathNormalizedPath, type: Type): Type {
        const newTypes = this.types.map(t => t.setTypeAtPath(path, type));
        return new UnionType(newTypes).simplify();
    }
}

export class NeverType extends Type {
    private constructor() {
        super();
    }

    static readonly instance: NeverType = new NeverType();

    getChildrenType(): Type {
        return NeverType.instance;
    }

    getTypeAtProperty(propertyName: string): Type {
        return NeverType.instance;
    }

    getTypeAtIndex(index: number): Type {
        return NeverType.instance;
    }

    simplify(): Type {
        return this;
    }

    toString(): string {
        return "never";
    }

    setTypeAtPath(path: JSONPathNormalizedPath, type: Type): Type {
        if (path.length === 0)
            return type;
        else
            return this;
    }
}

export class AnyType extends Type {
    private constructor() {
        super();
    }

    static readonly instance: AnyType = new AnyType();

    getChildrenType(): Type {
        return AnyType.instance;
    }

    getTypeAtProperty(propertyName: string): Type {
        return AnyType.instance;
    }

    getTypeAtIndex(index: number): Type {
        return AnyType.instance;
    }

    simplify(): Type {
        return this;
    }

    toString(): string {
        return "any";
    }

    setTypeAtPath(path: JSONPathNormalizedPath, type: Type): Type {
        if (path.length === 0)
            return type;
        else
            return this;
    }
}

export function intersectTypes(typeA: Type, typeB: Type): Type {
    if (typeA instanceof UnionType) {
        return new UnionType(typeA.types.map(type => intersectTypes(type, typeB))).simplify();
    }
    if (typeB instanceof UnionType) {
        return new UnionType(typeB.types.map(type => intersectTypes(typeA, type))).simplify();
    }

    if (isSubtypeOf(typeA, typeB))
        return typeA;
    if (isSubtypeOf(typeB, typeA))
        return typeB;

    if (typeA instanceof ObjectType && typeB instanceof ObjectType) {
        const propertyNames = new Set([...typeA.propertyTypes.keys(), ...typeB.propertyTypes.keys()]);
        const intersectedPropertyTypes = new Map<string, Type>();
        for (const propertyName of propertyNames) {
            const propertyTypeA = typeA.getTypeAtProperty(propertyName);
            const propertyTypeB = typeB.getTypeAtProperty(propertyName);
            const intersectedPropertyType = intersectTypes(propertyTypeA, propertyTypeB);
            intersectedPropertyTypes.set(propertyName, intersectedPropertyType);
        }
        const intersectedRestPropertyType = intersectTypes(typeA.restPropertyType, typeB.restPropertyType);
        const intersectedRequiredProperties = typeA.requiredProperties.union(typeB.requiredProperties)
        return new ObjectType(intersectedPropertyTypes, intersectedRestPropertyType, intersectedRequiredProperties).simplify();
    }
    if (typeA instanceof ArrayType && typeB instanceof ArrayType) {
        const prefixElementTypes: Type[] = [];
        for (let i = 0; i < Math.max(typeA.prefixElementTypes.length, typeB.prefixElementTypes.length); i++) {
            const intersectedPrefixElementType = intersectTypes(typeA.prefixElementTypes[i], typeB.prefixElementTypes[i]);
            prefixElementTypes.push(intersectedPrefixElementType);
        }
        const restElementType = intersectTypes(typeA.restElementType, typeB.restElementType);
        return new ArrayType(prefixElementTypes, restElementType).simplify();
    }
    return NeverType.instance;
}

export function subtractTypes(typeA: Type, typeB: Type): Type {
    if (typeA instanceof UnionType) {
        const newTypes = typeA.types.map(type => subtractTypes(type, typeB))
        return new UnionType(newTypes).simplify();
    }
    if (typeB instanceof UnionType) {
        const newTypes = typeB.types.map(type => subtractTypes(typeA, type))
        return new UnionType(newTypes).simplify();
    }
    if (isSubtypeOf(typeA, typeB))
        return NeverType.instance;

    return typeA;
}

export function isSubtypeOf(typeA: Type, typeB: Type): boolean {
    if (typeB instanceof AnyType)
        return true;
    if (typeB instanceof UnionType) {
        return typeB.types.some(type => isSubtypeOf(typeA, type));
    }

    if (typeA instanceof LiteralType) {
        return typeB instanceof LiteralType && typeA.value === typeB.value || typeB instanceof PrimitiveType && typeA.type === typeB.type;
    }
    if (typeA instanceof PrimitiveType) {
        return typeB instanceof PrimitiveType && typeA.type === typeB.type;
    }
    if (typeA instanceof ObjectType) {
        if (typeB instanceof ObjectType) {
            const propertyNames = new Set([...typeA.propertyTypes.keys(), ...typeB.propertyTypes.keys()]);
            for (const propertyName of propertyNames) {
                if (!isSubtypeOf(typeA.getTypeAtProperty(propertyName), typeB.getTypeAtProperty(propertyName)))
                    return false;
            }
            if (!typeA.requiredProperties.isSupersetOf(typeB.requiredProperties))
                return false;
            return true;
        }
        else
            return false;
    }
    if (typeA instanceof ArrayType) {
        if (typeB instanceof ArrayType) {
            // TODO: repair
            for (let i = 0; i < typeA.prefixElementTypes.length; i++) {
                if (!isSubtypeOf(typeA.prefixElementTypes[i], typeB.getTypeAtIndex(i)))
                    return false;
            }
            if (!isSubtypeOf(typeA.restElementType, typeB.getTypeAtIndex(typeA.prefixElementTypes.length)))
                return false;
            return true;
        }
    }
    if (typeA instanceof NeverType) {
        return true;
    }
    if (typeA instanceof UnionType) {
        return typeA.types.every(type => isSubtypeOf(type, typeB));
    }
    return false;
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