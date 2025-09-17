# Dokumentasi Refactoring & Panduan Pengembangan

Dokumen ini menjelaskan perubahan besar yang dilakukan untuk menyelaraskan tipe data (types) antara frontend dan backend, serta memberikan panduan untuk pengembangan fitur di masa depan agar tetap konsisten.

## Bagian 1: Dokumentasi Perubahan

### Masalah Awal

Sebelum refactoring, tipe data untuk model seperti `Client`, `Project`, dan `Proposal` didefinisikan secara manual di frontend (`src/lib/api.ts`). Di sisi lain, proyek sudah memiliki skrip `npm run generate:api` untuk membuat tipe dari spesifikasi OpenAPI, tetapi file `openapi.yaml` di backend tidak lengkap.

Hal ini menyebabkan beberapa masalah:
1.  **Duplikasi Kode**: Tipe didefinisikan di backend (dalam model PHP) dan di frontend (dalam TypeScript).
2.  **Risiko Inkonsistensi**: Jika model di backend berubah, tidak ada jaminan tipe di frontend akan diperbarui, yang dapat menyebabkan bug saat runtime.
3.  **Alur Kerja Tidak Efisien**: Developer harus memperbarui tipe di dua tempat.

### Solusi yang Diimplementasikan

Kita telah menerapkan alur kerja "Single Source of Truth" di mana `openapi.yaml` menjadi sumber kebenaran tunggal untuk struktur API.

**Perubahan di Backend (`proposal-backend`):**
*   File `openapi.yaml` telah dilengkapi dengan skema dan path untuk model `Client`, `Project`, dan `Proposal`. Skema ini sekarang mencerminkan struktur data yang sebenarnya di database.

**Perubahan di Frontend (`proposal-app`):**
*   File `src/types/openapi.d.ts` sekarang berisi tipe-tipe TypeScript yang kaya, yang di-generate secara otomatis dari `openapi.yaml`.
*   File `src/lib/api.ts` telah di-refactor. `Interface` manual untuk `Client`, `Project`, dan `Proposal` telah dihapus.
*   Sebagai gantinya, `api.ts` sekarang mengimpor tipe-tipe tersebut dari `openapi.d.ts`, memastikan frontend selalu sinkron dengan spesifikasi backend.

### Manfaat
*   **Type Safety**: Mencegah bug akibat ketidakcocokan tipe antara frontend dan backend.
*   **Kemudahan Perawatan**: Perubahan pada struktur API hanya perlu didefinisikan di satu tempat (`openapi.yaml`).
*   **Efisiensi**: Developer tidak perlu lagi menulis tipe secara manual di frontend.

---

## Bagian 2: Panduan Menambahkan Model Baru

Gunakan alur kerja ini setiap kali Anda menambahkan model data baru ke dalam sistem. Kita akan gunakan contoh penambahan model **"Invoice"**.

### Langkah 1: Implementasi di Backend (Laravel)

1.  **Buat Model & Migrasi**:
    ```bash
    php artisan make:model Invoice -m
    ```
2.  **Definisikan Skema Database**: Edit file migrasi yang baru dibuat di `database/migrations/` untuk menambahkan kolom-kolom yang dibutuhkan (misal: `project_id`, `amount`, `status`, `due_date`).
3.  **Jalankan Migrasi**:
    ```bash
    php artisan migrate
    ```
4.  **Definisikan Properti Model**: Buka `app/Models/Invoice.php` dan tambahkan properti yang bisa diisi ke dalam array `$fillable`.
5.  **Buat Controller**:
    ```bash
    php artisan make:controller Api/InvoiceController --api
    ```
6.  **Tambahkan Route**: Buka `routes/api.php` dan tambahkan API resource route untuk invoice.
    ```php
    use App\Http\Controllers\Api\InvoiceController;

    Route::apiResource('invoices', InvoiceController::class);
    ```

### Langkah 2: Perbarui Spesifikasi OpenAPI

Ini adalah langkah krusial.

1.  **Buka `openapi.yaml`** di proyek backend.
2.  **Tambahkan Skema Baru**: Di bawah `components.schemas`, tambahkan definisi untuk `Invoice` dan `InvoiceFormData`.
    ```yaml
    # ... di dalam components.schemas
    Invoice:
      type: object
      properties:
        id:
          type: integer
        project_id:
          type: integer
        amount:
          type: number
          format: float
        status:
          type: string
          example: "pending"
        due_date:
          type: string
          format: date
    InvoiceFormData:
      type: object
      properties:
        project_id:
          type: integer
        amount:
          type: number
          format: float
        status:
          type: string
        due_date:
          type: string
          format: date
    ```
3.  **Tambahkan Path Baru**: Di bawah `paths`, tambahkan definisi untuk `/api/invoices`.
    ```yaml
    # ... di dalam paths
    /api/invoices:
      get:
        summary: Tampilkan semua invoice
        responses:
          '200':
            description: Daftar invoice.
            content:
              application/json:
                schema:
                  type: array
                  items:
                    $ref: '#/components/schemas/Invoice'
      # ... (tambahkan juga untuk POST)
    ```

### Langkah 3: Generate Tipe di Frontend

1.  **Pindah ke direktori `proposal-app`**.
2.  **Jalankan Perintah Generate**:
    ```bash
    npm run generate:api
    ```
3.  **Verifikasi**: Periksa file `src/types/openapi.d.ts`. Anda seharusnya melihat `interface Invoice` yang baru.

### Langkah 4: Implementasi di Frontend

1.  **Buka `src/lib/api.ts`**.
2.  **Impor Tipe Baru**: Tambahkan `Invoice` dan `InvoiceFormData` ke daftar impor di bagian atas.
    ```typescript
    export type Invoice = components["schemas"]["Invoice"];
    export type InvoiceFormData = components["schemas"]["InvoiceFormData"];
    ```
3.  **Buat Fungsi API**: Tambahkan fungsi-fungsi baru untuk mengelola invoice (`getInvoices`, `createInvoice`, dll.) di dalam `api.ts`.
4.  **Gunakan di Komponen**: Sekarang Anda bisa mengimpor dan menggunakan fungsi serta tipe baru tersebut di halaman atau komponen React Anda.

Dengan mengikuti langkah-langkah ini, Anda memastikan bahwa setiap fitur baru yang Anda bangun akan selaras dengan arsitektur yang rapi dan kokoh yang telah kita siapkan.
