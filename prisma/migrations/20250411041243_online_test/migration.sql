-- CreateTable
CREATE TABLE "online_tests" (
    "online_test_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "temp_code_id" TEXT,
    "duration_in_minutes" INTEGER NOT NULL DEFAULT 30,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "results" JSONB,

    CONSTRAINT "online_tests_pkey" PRIMARY KEY ("online_test_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "online_tests_test_id_key" ON "online_tests"("test_id");

-- CreateIndex
CREATE UNIQUE INDEX "online_tests_temp_code_id_key" ON "online_tests"("temp_code_id");

-- AddForeignKey
ALTER TABLE "online_tests" ADD CONSTRAINT "online_tests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("test_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_tests" ADD CONSTRAINT "online_tests_temp_code_id_fkey" FOREIGN KEY ("temp_code_id") REFERENCES "test_temp_codes"("test_temp_code_id") ON DELETE CASCADE ON UPDATE CASCADE;
