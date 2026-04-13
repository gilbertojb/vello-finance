-- Adiciona coluna cover_url para armazenar a capa personalizada do produto ativo
ALTER TABLE "public"."tenant_products" ADD COLUMN "cover_url" text;
