/*
  Warnings:

  - Added the required column `deadline` to the `ArbitrationRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ArbitrationRequest" ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL;
