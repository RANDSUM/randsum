# JSDoc Template for RANDSUM

This document provides templates for JSDoc comments to be used throughout the RANDSUM codebase.

## Function Template

```typescript
/**
 * Brief description of what the function does
 *
 * @param {Type} paramName - Description of the parameter
 * @param {Type} [optionalParam] - Description of the optional parameter
 * @returns {ReturnType} Description of the return value
 * @throws {ErrorType} Description of when this error is thrown
 *
 * @example
 * // Example usage of the function
 * const result = myFunction(param1, param2);
 */
function myFunction(paramName: Type, optionalParam?: Type): ReturnType {
  // Function implementation
}
```

## Class Template

```typescript
/**
 * Brief description of what the class represents
 *
 * @example
 * // Example of creating an instance
 * const instance = new MyClass(param);
 */
class MyClass {
  /**
   * Brief description of the property
   */
  public propertyName: Type;

  /**
   * Constructor description
   *
   * @param {Type} paramName - Description of the parameter
   */
  constructor(paramName: Type) {
    // Constructor implementation
  }

  /**
   * Brief description of what the method does
   *
   * @param {Type} paramName - Description of the parameter
   * @returns {ReturnType} Description of the return value
   */
  public methodName(paramName: Type): ReturnType {
    // Method implementation
  }
}
```

## Interface Template

```typescript
/**
 * Brief description of what the interface represents
 */
interface IMyInterface {
  /**
   * Brief description of the property
   */
  propertyName: Type;

  /**
   * Brief description of what the method does
   *
   * @param {Type} paramName - Description of the parameter
   * @returns {ReturnType} Description of the return value
   */
  methodName(paramName: Type): ReturnType;
}
```

## Type Template

```typescript
/**
 * Brief description of what the type represents
 */
type MyType = {
  /**
   * Brief description of the property
   */
  propertyName: Type;
};
```

## Enum Template

```typescript
/**
 * Brief description of what the enum represents
 */
enum MyEnum {
  /**
   * Description of this enum value
   */
  VALUE_ONE = 'value_one',

  /**
   * Description of this enum value
   */
  VALUE_TWO = 'value_two'
}
```
