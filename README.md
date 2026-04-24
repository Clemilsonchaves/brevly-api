# brevly-api

API para encurtamento de URLs, exportação de CSV e contagem de acessos.

## Endpoints

### Health Check
- `GET /health`
	- Verifica se a API está online.

### Criar link
- `POST /links`
	- Body: `{ originalUrl: string, shortCode?: string }`
	- Cria um novo link encurtado. Se não enviar `shortCode`, será gerado automaticamente.
	- Resposta: `{ id, originalUrl, shortUrl, shortCode, accessCount, createdAt }`

### Listar links
- `GET /links`
	- Lista todos os links cadastrados (paginado).
	- Query params: `page`, `limit`
	- Resposta: `{ total, page, limit, data: [ ...links ] }`

### Deletar link
- `DELETE /links/:shortCode`
	- Remove um link pelo código encurtado.

### Obter link original
- `GET /links/:shortCode`
	- Retorna o link original a partir do código encurtado.

### Exportar CSV
- `GET /links/export`
	- Faz download de todos os links em formato CSV.

## Estrutura do objeto Link
```json
{
	"id": 1,
	"originalUrl": "https://exemplo.com",
	"shortUrl": "abc123",
	"shortCode": "abc123",
	"accessCount": 0,
	"createdAt": "2024-04-24T12:00:00.000Z"
}
```

## Tecnologias
- Node.js
- Fastify
- Drizzle ORM (PostgreSQL)
- nanoid
- TypeScript

## Variáveis de ambiente necessárias
- `DATABASE_URL` (conexão com o banco PostgreSQL)

## Como rodar localmente
```bash
pnpm install
pnpm build
pnpm start
```

## Observações
- O endpoint `/links/export` retorna o CSV diretamente para download.
- O campo `shortCode` é sempre igual ao `shortUrl`.
- O frontend consome essa API para criar, listar, deletar e exportar links.
