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

import { Point, subtract } from "@/_lib/point";
import { AbstractMatrix, Matrix, solve } from "ml-matrix";
import { Unit, getPtDensity } from "@/_lib/unit";

export type SimpleLine = [Point, Point];

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
export function getPerspectiveTransform(src: Point[], dst: Point[]): Matrix {
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

  const s = Matrix.from1DArray(3, 3, X);
  return s;
}

export function translatePoints(pts: Point[], dx: number, dy: number): Point[] {
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

export function rectCorners(width: number, height: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
}

export function getBounds(pts: Point[]): Point[] {
  const first = pts[0];
  let minX = first.x;
  let minY = first.y;
  let maxX = first.x;
  let maxY = first.y;
  for (const { x, y } of pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [
    { x: minX, y: minY },
    { x: maxX, y: maxY },
  ];
}

function getDstVertices(
  width: number,
  height: number,
  ptDensity: number,
): Point[] {
  const dx = width * ptDensity;
  const dy = height * ptDensity;
  return rectCorners(dx, dy);
}

export function getCalibrationCenterPoint(
  width: number,
  height: number,
  unitOfMeasure: Unit,
): Point {
  return {
    x: width * getPtDensity(unitOfMeasure) * 0.5,
    y: height * getPtDensity(unitOfMeasure) * 0.5,
  };
}

export function getPerspectiveTransformFromPoints(
  points: Point[],
  width: number,
  height: number,
  ptDensity: number,
  reverse?: boolean,
): Matrix {
  if (reverse) {
    return getPerspectiveTransform(
      points,
      getDstVertices(width, height, ptDensity),
    );
  } else {
    return getPerspectiveTransform(
      getDstVertices(width, height, ptDensity),
      points,
    );
  }
}

export function transformSimpleLine(line: SimpleLine, m: Matrix): SimpleLine {
  return transformPoints(line, m) as SimpleLine;
}

export function transformPoints(points: Point[], m: Matrix): Point[] {
  return points.map((p) => transformPoint(p, m));
}

export function transformPoint(p: Point, mm: Matrix): Point {
  const m = mm.to1DArray();
  let w = p.x * m[6] + p.y * m[7] + m[8];
  w = 1 / w;
  const ox = (p.x * m[0] + p.y * m[1] + m[2]) * w;
  const oy = (p.x * m[3] + p.y * m[4] + m[5]) * w;
  const result = { x: ox, y: oy };
  return result;
}

export function translate(p: Point): Matrix {
  return Matrix.from1DArray(3, 3, [1, 0, p.x, 0, 1, p.y, 0, 0, 1]);
}

export function scale(s: number, sy: null | number = null): Matrix {
  sy = sy ?? s;
  return Matrix.from1DArray(3, 3, [s, 0, 0, 0, sy, 0, 0, 0, 1]);
}

export function scaleAboutPoint(s: number, point: Point): Matrix {
  return translate(point)
    .mmul(scale(s))
    .mmul(translate({ x: -point.x, y: -point.y }));
}

export function rotate(angle: number): Matrix {
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);
  return new Matrix([
    [cosAngle, -sinAngle, 0],
    [sinAngle, cosAngle, 0],
    [0, 0, 1],
  ]);
}

export function align(line: SimpleLine, to: SimpleLine): Matrix {
  const toOrigin = translate({ x: -line[0].x, y: -line[0].y });
  const rotateTo = rotate(angle(to) - angle(line));
  return translate(to[0]).mmul(rotateTo).mmul(toOrigin);
}

export function move(from: Point, to: Point): Matrix {
  return translate(subtract(to, from));
}

export function transformAboutPoint(matrix: Matrix, point: Point): Matrix {
  const translationToOrigin = translate({ x: -point.x, y: -point.y });
  const translationBack = translate(point);
  return translationBack.mmul(matrix).mmul(translationToOrigin);
}

export function rotateMatrixDeg(angleDegrees: number, origin: Point): Matrix {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const rotationMatrix = rotate(angleRadians);
  return transformAboutPoint(rotationMatrix, origin);
}

export function flipVertical(origin: Point): Matrix {
  return transformAboutPoint(scale(1, -1), origin);
}

export function flipHorizontal(origin: Point): Matrix {
  return transformAboutPoint(scale(-1, 1), origin);
}

export function angleDeg(line: SimpleLine): number {
  return angle(line) * (180 / Math.PI);
}

export function angle(line: SimpleLine): number {
  const [p1, p2] = line;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx);
}

export function distance(line: SimpleLine): number {
  const [p1, p2] = line;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function rotateToHorizontal(line: SimpleLine): Matrix {
  return rotateMatrixDeg(-angleDeg(line), line[0]);
}

export function flipAlong(line: SimpleLine): Matrix {
  const angle = angleDeg(line);
  const a = rotateMatrixDeg(-angle, line[0]);
  const b = translate({ x: 0, y: -line[0].y });
  const c = scale(1, -1);
  const d = translate({ x: 0, y: line[0].y });
  const e = rotateMatrixDeg(angle, line[0]);
  return e.mmul(d).mmul(c).mmul(b).mmul(a);
}

/**
 * Converts 3x3 matrix returned from getPerspectiveTransform(src, dst) to a 4x4 matrix as per https://stackoverflow.com/a/4833408/3376039
 * @param src - Coordinates of quadrangle vertices in the source image starting from top left clockwise.
 * @param dst - Coordinates of the corresponding quadrangle vertices in the destination image starting from top left clockwise.
 * @returns A css transform string
 */
export function toMatrix3d(m: Matrix): string {
  let r = m.clone();
  // Make the 3x3 into 4x4 by inserting a z component in the 3rd column.
  r.addColumn(2, AbstractMatrix.zeros(1, 3));
  r.addRow(2, AbstractMatrix.from1DArray(1, 4, [0, 0, 1, 0]));

  // Transpose since CSS.matrix3d is column major.
  r = r.transpose();
  return `matrix3d(${r.to1DArray().toString()})`;
}

export function sqrDist(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function dist(a: Point, b: Point): number {
  return Math.sqrt(sqrDist(a, b));
}

export function minIndex(a: number[]): number {
  let min = 0;
  for (let i = 1; i < a.length; i++) {
    if (a[i] < a[min]) {
      min = i;
    }
  }
  return min;
}

export function distToLine(line: SimpleLine, p: Point): number {
  return Math.sqrt(sqrDistToLine(line, p));
}

export function sqrDistToLine(line: SimpleLine, p: Point): number {
  const [a, b] = line;
  const len2 = sqrDist(a, b);
  if (len2 === 0) {
    return sqrDist(p, a);
  }
  const rise = b.y - a.y;
  const run = b.x - a.x;
  let t = ((p.x - a.x) * run + (p.y - a.y) * rise) / len2;
  // constrain t to the segment between a and b
  t = Math.max(0, Math.min(1, t));
  return sqrDist(p, { x: a.x + t * run, y: a.y + t * rise });
}

export function interp(from: Point, to: Point, portion: number): Point {
  const rest = 1.0 - portion;
  return {
    x: to.x * portion + from.x * rest,
    y: to.y * portion + from.y * rest,
  };
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
  const crossProduct =
    (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  if (crossProduct < 0) {
    return -1; // Clockwise orientation
  } else if (crossProduct > 0) {
    return 1; // Counterclockwise orientation
  } else {
    return 0; // Collinear points
  }
}

export function constrained(p: Point, anchorPoint: Point) {
  const dx = Math.abs(anchorPoint.x - p.x);
  const dy = Math.abs(anchorPoint.y - p.y);
  if (dx > 2 * dy) {
    return { x: p.x, y: anchorPoint.y };
  } else if (dy > 2 * dx) {
    return { x: anchorPoint.x, y: p.y };
  } else if (dx === 0 && dy === 0) {
    return anchorPoint;
  } else {
    // snap to 45 degree angle
    if (dx < dy) {
      return { x: p.x, y: anchorPoint.y + ((p.y - anchorPoint.y) / dy) * dx };
    } else {
      return { x: anchorPoint.x + ((p.x - anchorPoint.x) / dx) * dy, y: p.y };
    }
  }
}

export function isFlipped(m: Matrix): boolean {
  return m.get(1, 1) * m.get(0, 0) < 0;
}

export interface RestoreTransforms {
  localTransform: Matrix;
  calibrationTransform: Matrix;
}
