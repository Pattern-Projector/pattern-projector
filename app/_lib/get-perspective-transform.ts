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

import { Matrix, solve } from "ml-matrix";

import Point from "./interfaces/point";

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
export default function getPerspectiveTransform(
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
  console.log(s);
  return s;
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
