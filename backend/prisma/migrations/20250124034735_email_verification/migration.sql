-- AlterTable
ALTER TABLE "Arbiter" ADD COLUMN     "emailToVerify" TEXT,
ADD COLUMN     "emailVerificationPin" TEXT,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);
