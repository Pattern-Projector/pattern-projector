/*M///////////////////////////////////////////////////////////////////////////////////////
//
//  IMPORTANT: READ BEFORE DOWNLOADING, COPYING, INSTALLING OR USING.
//
//  By downloading, copying, installing or using the software you agree to this license.
//  If you do not agree to this license, do not download, install,
//  copy or use the software.
//
//
//                           License Agreement
//                For Open Source Computer Vision Library
//
// Copyright (C) 2000-2008, Intel Corporation, all rights reserved.
// Copyright (C) 2009, Willow Garage Inc., all rights reserved.
// Copyright (C) 2014-2015, Itseez Inc., all rights reserved.
// Third party copyrights are property of their respective owners.
//
// Redistribution and use in source and binary forms, with or without modification,
// are permitted provided that the following conditions are met:
//
//   * Redistribution's of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//
//   * Redistribution's in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//
//   * The name of the copyright holders may not be used to endorse or promote products
//     derived from this software without specific prior written permission.
//
// This software is provided by the copyright holders and contributors "as is" and
// any express or implied warranties, including, but not limited to, the implied
// warranties of merchantability and fitness for a particular purpose are disclaimed.
// In no event shall the Intel Corporation or contributors be liable for any direct,
// indirect, incidental, special, exemplary, or consequential damages
// (including, but not limited to, procurement of substitute goods or services;
// loss of use, data, or profits; or business interruption) however caused
// and on any theory of liability, whether in contract, strict liability,
// or tort (including negligence or otherwise) arising in any way out of
// the use of this software, even if advised of the possibility of such damage.
//
//M*/

import { Point } from "@/_lib/point";
import { AbstractMatrix, Matrix, solve } from 'ml-matrix';


/** Calculates a perspective transform from four pairs of the corresponding points.
 *
 * A TypeScript implementation of OpenCV's getPerspectiveTransform(src, dst, solve) available here:
 * https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/imgwarp.cpp#L3432
 *
 * Calculates coefficients of perspective transformation
 * which maps (xi,yi) to (ui,vi), (i=1,2,3,4):
 *
 *      c00*xi + c01*yi + c02
 * ui = ---------------------
 *      c20*xi + c21*yi + c22
 *
 *      c10*xi + c11*yi + c12
 * vi = ---------------------
 *      c20*xi + c21*yi + c22
 *
 * Coefficients are calculated by solving linear system:
 * / x0 y0  1  0  0  0 -x0*u0 -y0*u0 \ /c00\ /u0\
 * | x1 y1  1  0  0  0 -x1*u1 -y1*u1 | |c01| |u1|
 * | x2 y2  1  0  0  0 -x2*u2 -y2*u2 | |c02| |u2|
 * | x3 y3  1  0  0  0 -x3*u3 -y3*u3 |.|c10|=|u3|,
 * |  0  0  0 x0 y0  1 -x0*v0 -y0*v0 | |c11| |v0|
 * |  0  0  0 x1 y1  1 -x1*v1 -y1*v1 | |c12| |v1|
 * |  0  0  0 x2 y2  1 -x2*v2 -y2*v2 | |c20| |v2|
 * \  0  0  0 x3 y3  1 -x3*v3 -y3*v3 / \c21/ \v3/
 *
 * where:
 *   cij - matrix coefficients, c22 = 1
 *
 * @param src - Coordinates of quadrangle vertices in the source image starting from top left clockwise.
 * @param dst - Coordinates of the corresponding quadrangle vertices in the destination image starting from top left clockwise.
 * @returns A 3x3 matrix of a perspective transform.
 */
export function getPerspectiveTransform(
  src: Point[],
  dst: Point[]
): Matrix {
  const a: number[][] = Array.from(Array(8), () => Array(8));
  const b: number[] = new Array(8);

  for (let i = 0; i < 4; i++) {
    a[i][0] = src[i].x;
    a[i + 4][3] = src[i].x;

    a[i][1] = src[i].y;
    a[i + 4][4] = src[i].y;

    a[i][2] = 1;
    a[i + 4][5] = 1;

    a[i][3] = 0;
    a[i][4] = 0;
    a[i][5] = 0;
    a[i + 4][0] = 0;
    a[i + 4][1] = 0;
    a[i + 4][2] = 0;

    const srcX = src[i].x;
    const dstX = dst[i].x;
    const srcY = src[i].y;
    const dstY = dst[i].y;
    a[i][6] = -srcX * dstX;
    a[i][7] = -srcY * dstX;
    a[i + 4][6] = -srcX * dstY;
    a[i + 4][7] = -srcY * dstY;

    b[i] = dst[i].x;
    b[i + 4] = dst[i].y;
  }

  const A = new Matrix(a);
  const B = Matrix.columnVector(b);
  const x = solve(A, B, true);
  const X = x.getColumn(0);
  X.push(1);

  var s = Matrix.from1DArray(3, 3, X);
  return s;
}


function getDstVertices(width: number, height: number, ptDensity: number): Point[] {
  const ox = 0;
  const oy = 0;
  const mx = +width * ptDensity + ox;
  const my = +height * ptDensity + oy;

  const dstVertices = [
    { x: ox, y: oy },
    { x: mx, y: oy },
    { x: mx, y: my },
    { x: ox, y: my },
  ];

  return dstVertices;
}

export function getPerspectiveTransformFromPoints(
  points: Point[],
  width: number,
  height: number,
  ptDensity: number,
  reverse?: boolean,
): Matrix {
  if (reverse){
    return getPerspectiveTransform(points, getDstVertices(width, height, ptDensity));
  }else{
    return getPerspectiveTransform(getDstVertices(width, height, ptDensity), points);
  }
}

export function transformPoints(points: Point[], m: Matrix): Point[] {
  return points.map((p) => transformPoint(p, m));
}

export function transformPoint(p: Point, mm: Matrix): Point {
  let m = mm.to1DArray();
  var w = p.x * m[6] + p.y * m[7] + m[8];
  w = 1 / w;
  let ox = (p.x * m[0] + p.y * m[1] + m[2]) * w;
  let oy = (p.x * m[3] + p.y * m[4] + m[5]) * w;
  let result = { x: ox, y: oy };
  return result;
}

export function translate(p: Point): Matrix {
  return Matrix.from1DArray(3, 3, [1, 0, p.x, 0, 1, p.y, 0, 0, 1]);
}

export function scale(s: number): Matrix {
  return Matrix.from1DArray(3, 3, [s, 0, 0, 0, s, 0, 0, 0, 1]);
}

export function rotateMatrixDeg(matrix: Matrix, angleDegrees: number): Matrix {
  // Extract scale/reflection components (top-left 2x2 submatrix)
  const scaleReflection = matrix.subMatrix(0, 1, 0, 1);

  // Extract translation components
  const translation = matrix.subMatrix(0, 1, 2, 2);

  // Calculate the determinant of the 2x2 scale/reflection submatrix
  const det = scaleReflection.get(0, 0) * scaleReflection.get(1, 1) - scaleReflection.get(0, 1) * scaleReflection.get(1, 0);

  // Check if the object is reflected
  const isReflected = det < 0;

  // Create the rotation matrix
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cosAngle = Math.cos(angleRadians);
  const sinAngle = Math.sin(angleRadians);
  let rotationMatrix = new Matrix([
    [cosAngle, -sinAngle],
    [sinAngle, cosAngle],
  ]);

  // Modify the rotation matrix if the object is reflected
  if (isReflected) {
    rotationMatrix = rotationMatrix.transpose();
  }

  // Apply the rotation to the scale/reflection components
  const rotatedScaleReflection = scaleReflection.mmul(rotationMatrix);

  // Reconstruct the final matrix
  const rotatedMatrix = new Matrix([
    [rotatedScaleReflection.get(0, 0), rotatedScaleReflection.get(0, 1), translation.get(0, 0)],
    [rotatedScaleReflection.get(1, 0), rotatedScaleReflection.get(1, 1), translation.get(1, 0)],
    [0, 0, 1],
  ]);

  return rotatedMatrix;
}

export class DecomposedTransform {
  scale: Point = {x: 1, y: 1}
  skew: Point = {x: 1, y: 1}
  translation: Point = {x: 1, y: 1}
  constructor(
    public a: number,
    public b: number,
    public c: number,
    public d: number,
    public tx: number,
    public ty: number,
  ) {
    this.scale = {x:a, y:d}
    this.skew = {x:b, y:c}
    this.translation = {x: tx, y: ty}
  }

  formatCss(): string {
    return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.tx}, ${this.ty})`;
  }
  formatCssNoTranslation(): string {
    return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, 0, 0)`;
  }
  
}

export function decomposeTransformMatrix(matrix: Matrix): DecomposedTransform {
  // Extract the elements of the transformation matrix
  const a = matrix.get(0, 0);
  const b = matrix.get(0, 1);
  const c = matrix.get(1, 0);
  const d = matrix.get(1, 1);
  const tx = matrix.get(0, 2);
  const ty = matrix.get(1, 2);

  // Return the decomposed values as an object
  return new DecomposedTransform(
    a,b,c,d,tx,ty
  );
}

export function mirrorMatrix2Points(matrix: Matrix, point1: Point, point2: Point): Matrix {
  // Calculate the slope and y-intercept of the line
  const slope = (point2.y - point1.y) / (point2.x - point1.x);
  const yIntercept = point1.y - slope * point1.x;

  // Create the reflection matrix
  const reflectionMatrix = new Matrix([
    [1 - 2 * slope * slope, -2 * slope, 2 * slope * yIntercept],
    [-2 * slope, -1 + 2 * slope * slope, 2 * yIntercept],
    [0, 0, 1]
  ]);

  // Multiply the transformation matrix by the reflection matrix
  const mirroredMatrix = matrix.mmul(reflectionMatrix);

  return mirroredMatrix;
}

/* Applies an in-place vertical flip to the transformation matrix */
export function flipMatrixVertically(matrix: Matrix): Matrix {

  // Create a flip matrix to perform horizontal flipping
  const flipMatrix = new Matrix([
    [1, 0, 0],
    [0, -1, 0],
    [0, 0, 1]
  ]);
    
  const tx = matrix.get(0, 2);
  const ty = matrix.get(1, 2);

  /* First translate it to origin */
  const translation = new Matrix([
    [1, 0, -tx],
    [0, 1, -ty],
    [0, 0, 1]
  ]);

  const m0 = matrix.mmul(translation);
  const flipped = flipMatrix.mmul(m0);
  /* Use the original translation component */
  return overrideTranslationFromMatrix(flipped, matrix)
}

/* Applies an in-place horizontal flip to the transformation matrix */
export function flipMatrixHorizontally(matrix: Matrix): Matrix {
  // Create a flip matrix to perform horizontal flipping
  const flipMatrix = new Matrix([
    [-1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);

  const tx = matrix.get(0, 2);
  const ty = matrix.get(1, 2);

  /* First translate it to origin */
  const translation = new Matrix([
    [1, 0, -tx],
    [0, 1, -ty],
    [0, 0, 1]
  ]);

  const m0 = matrix.mmul(translation);
  const flipped = flipMatrix.mmul(m0);
  /* Use the original translation component */
  return overrideTranslationFromMatrix(flipped, matrix)
}

export function isMatrixFlippedVertically(matrix: Matrix): boolean {
  const decomposedMatrix = decomposeTransformMatrix(matrix)
  return decomposedMatrix.scale.y < 0; 
}

export function isMatrixFlippedHorizontally(matrix: Matrix): boolean {
  const decomposedMatrix = decomposeTransformMatrix(matrix)
  return decomposedMatrix.scale.x < 0; 
}

/* Overrides the translation component of destMatrix with the srcMatrix's */
export function overrideTranslationFromMatrix(destMatrix: Matrix, srcMatrix: Matrix): Matrix {
  const tx = srcMatrix.get(0, 2);
  const ty = srcMatrix.get(1, 2);

  let newMatrix = destMatrix.clone()
  newMatrix.set(0, 2, tx);
  newMatrix.set(1, 2, ty);

  return newMatrix;
}

/* Extracts only the translation portion of the transformation matrix */
export function extractTranslationMatrix(matrix: Matrix): Matrix {
  const tx = matrix.get(0, 2);
  const ty = matrix.get(1, 2);
  return new Matrix([
    [1, 0, tx],
    [0, 1, ty],
    [0, 0, 1]
  ]);
}

/* Scale only the translation portion of the transformation matrix */
export function scaleMatrixTranslation(matrix: Matrix, scale: number): Matrix {
  const tx = matrix.get(0, 2);
  const ty = matrix.get(1, 2);
  const newMatrix = matrix.clone();
  newMatrix.set(0, 2, tx * scale);
  newMatrix.set(1, 2, ty * scale);
  return newMatrix;
}

/* Extracts only the rotation and scale portion of the transformation matrix */
export function extractRotationScaleMatrix(matrix: Matrix): Matrix {
  const newMatrix = matrix.clone();
  newMatrix.set(0,2,0);
  newMatrix.set(1,2,0);
  return newMatrix;
}

/**
 * Converts 3x3 matrix returned from getPerspectiveTransform(src, dst) to a 4x4 matrix as per https://stackoverflow.com/a/4833408/3376039
 * @param src - Coordinates of quadrangle vertices in the source image starting from top left clockwise.
 * @param dst - Coordinates of the corresponding quadrangle vertices in the destination image starting from top left clockwise.
 * @returns A css transfomr string
 */
export function toMatrix3d(m: Matrix): string {
  var r = m.clone();
  // Make the 3x3 into 4x4 by inserting a z component in the 3rd column.
  r.addColumn(2, AbstractMatrix.zeros(1, 3));
  r.addRow(2, AbstractMatrix.from1DArray(1, 4, [0, 0, 1, 0]));

  // Transpose since CSS.matrix3d is column major.
  r = r.transpose();
  return `matrix3d(${r.to1DArray().toString()})`;
}

export function sqrdist(a: Point, b: Point): number {
  let dx = a.x - b.x;
  let dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function minIndex(a: number[]): number {
  var min = 0;
  for (var i = 1; i < a.length; i++) {
    if (a[i] < a[min]) {
      min = i;
    }
  }
  return min;
}

export function interp(from: Point, to: Point, portion: number): Point {
  const rest = 1.0 - portion;
  return { x: to.x * portion + from.x * rest, y: to.y * portion + from.y * rest };
}

/* Returns true if the list of points define a concave polygon, false otherwise */
export function checkIsConcave(points: Point[]): boolean {
  const n = points.length;
  if (n < 4) {
    return false; // A polygon with less than 4 points is always convex
  }

  let prevOrientation = 0;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const orientation = getOrientation(p1, p2, p3);
    if (orientation !== 0) {
      if (prevOrientation === 0) {
        prevOrientation = orientation;
      } else if (orientation !== prevOrientation) {
        return true; // The polygon is concave
      }
    }
  }

  return false; // The polygon is convex
}

function getOrientation(p1: Point, p2: Point, p3: Point): number {
  const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  if (crossProduct < 0) {
    return -1; // Clockwise orientation
  } else if (crossProduct > 0) {
    return 1; // Counterclockwise orientation
  } else {
    return 0; // Collinear points
  }
}
