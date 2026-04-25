/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EntryType = '일반' | '예약' | '공사';

export interface Reservation {
  id: string;
  plateNumber: string;
  reservationTime?: string;
}

export interface EntryRecord {
  id: string;
  round: number;
  type: EntryType;
  plateNumber: string;
  entryTime: string;
  exitTime?: string;
  content?: string;
  remarks?: string;
}

export interface AppState {
  reservations: Reservation[];
  records: EntryRecord[];
  apiKey?: string;
}
