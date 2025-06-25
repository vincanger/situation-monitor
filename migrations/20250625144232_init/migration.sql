-- CreateTable
CREATE TABLE "UserAnalysis" (
    "id" SERIAL NOT NULL,
    "handle" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "profileImageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAnalysis_handle_key" ON "UserAnalysis"("handle");
