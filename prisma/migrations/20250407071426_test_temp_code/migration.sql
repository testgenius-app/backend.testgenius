-- CreateTable
CREATE TABLE "test_temp_codes" (
    "test_temp_code_id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "test_id" TEXT NOT NULL,

    CONSTRAINT "test_temp_codes_pkey" PRIMARY KEY ("test_temp_code_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_temp_codes_code_key" ON "test_temp_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "test_temp_codes_test_id_key" ON "test_temp_codes"("test_id");

-- AddForeignKey
ALTER TABLE "test_temp_codes" ADD CONSTRAINT "test_temp_codes_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("test_id") ON DELETE CASCADE ON UPDATE CASCADE;
