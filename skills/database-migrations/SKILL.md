---
name: database-migrations
description: 数据库迁移最佳实践，涵盖 PostgreSQL、MySQL 和常见 ORM（Prisma、Drizzle、Kysely、Django、TypeORM、golang-migrate）的架构变更、数据迁移、回滚和零停机部署。
origin: nothing-claude-code
---

# 数据库迁移模式

面向生产系统的安全、可逆的数据库架构变更。

## 何时激活

- 创建或更改数据库表
- 添加/删除列或索引
- 运行数据迁移（回填、转换）
- 规划零停机架构变更
- 为新项目设置迁移工具

## 核心原则

1. **每次变更都是迁移** — 永远不要手动更改生产数据库
2. **迁移在生产中是向前唯一的** — 回滚使用新的向前迁移
3. **架构迁移和数据迁移分开** — 不要在一个迁移中混合 DDL 和 DML
4. **针对生产规模数据测试迁移** — 在 100 行上工作的迁移可能在 1000 万行上锁定
5. **迁移一旦部署就不可变** — 永远不要编辑已在生产中运行的迁移

## 迁移安全检查清单

在应用任何迁移之前：

- [ ] 迁移有 UP 和 DOWN（或者明确标记为不可逆）
- [ ] 大表上没有全表锁（使用并发操作）
- [ ] 新列有默认值或可为空（永远不要添加没有默认值的 NOT NULL）
- [ ] 索引并发创建（对于现有表不是内联 CREATE TABLE）
- [ ] 数据回填是与架构变更单独的迁移
- [ ] 针对生产数据副本进行了测试
- [ ] 回滚计划已记录

## PostgreSQL 模式

### 安全添加列

```sql
-- 好：可空列，无锁
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- 好：带默认值的列（Postgres 11+ 是即时的，无需重写）
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- 错误：在现有表上使用没有默认值的 NOT NULL（需要完全重写）
ALTER TABLE users ADD COLUMN role TEXT NOT NULL;
-- 这会锁定表并重写每一行
```

### 无停机添加索引

```sql
-- 错误：在大表上阻止写入
CREATE INDEX idx_users_email ON users (email);

-- 好：非阻塞，允许并发写入
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

-- 注意：CONCURRENTLY 不能在事务块内运行
-- 大多数迁移工具需要特殊处理
```

### 重命名列（零停机）

永远不要在生产中直接重命名。使用 expand-contract 模式：

```sql
-- 步骤 1：添加新列（迁移 001）
ALTER TABLE users ADD COLUMN display_name TEXT;

-- 步骤 2：回填数据（迁移 002，数据迁移）
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- 步骤 3：更新应用程序代码以读取/写入两列
-- 部署应用程序更改

-- 步骤 4：停止写入旧列，删除它（迁移 003）
ALTER TABLE users DROP COLUMN username;
```

### 安全删除列

```sql
-- 步骤 1：移除所有对列的应用程序引用
-- 步骤 2：部署没有列引用的应用程序
-- 步骤 3：在下一个迁移中删除列
ALTER TABLE orders DROP COLUMN legacy_status;

-- 对于 Django：使用 SeparateDatabaseAndState 从模型中移除
-- 而不生成 DROP COLUMN（然后在下一个迁移中删除）
```

### 大数据迁移

```sql
-- 错误：在单个事务中更新所有行（锁定表）
UPDATE users SET normalized_email = LOWER(email);

-- 好：带进度的批量更新
DO $$
DECLARE
  batch_size INT := 10000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE users
    SET normalized_email = LOWER(email)
    WHERE id IN (
      SELECT id FROM users
      WHERE normalized_email IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % rows', rows_updated;
    EXIT WHEN rows_updated = 0;
    COMMIT;
  END LOOP;
END $$;
```

## Prisma（TypeScript/Node.js）

### workflow process

```bash
# 从架构更改创建迁移
npx prisma migrate dev --name add_user_avatar

# 在生产中应用待处理的迁移
npx prisma migrate deploy

# 重置数据库（仅限开发）
npx prisma migrate reset

# 架构更改后生成客户端
npx prisma generate
```

### 架构示例

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  orders    Order[]

  @@map("users")
  @@index([email])
}
```

### 自定义 SQL 迁移

对于 Prisma 无法表达的操作（并发索引、数据回填）：

```bash
# 创建空迁移，然后手动编辑 SQL
npx prisma migrate dev --create-only --name add_email_index
```

```sql
-- migrations/20240115_add_email_index/migration.sql
-- Prisma 无法生成 CONCURRENTLY，所以我们手动编写
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

## Drizzle（TypeScript/Node.js）

### workflow process

```bash
# 从架构更改生成迁移
npx drizzle-kit generate

# 应用迁移
npx drizzle-kit migrate

# 直接推送架构（仅限开发，无迁移文件）
npx drizzle-kit push
```

### 架构示例

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## Kysely（TypeScript/Node.js）

### workflow process（kysely-ctl）

```bash
# 初始化配置文件（kysely.config.ts）
kysely init

# 创建新的迁移文件
kysely migrate make add_user_avatar

# 应用所有待处理的迁移
kysely migrate latest

# 回滚最后一个迁移
kysely migrate down

# 显示迁移状态
kysely migrate list
```

### 迁移文件

```typescript
// migrations/2024_01_15_001_create_user_profile.ts
import { type Kysely, sql } from 'kysely'

// 重要：始终使用 Kysely<any>，而不是你的类型化 DB 接口。
// 迁移是时间冻结的，不得依赖于当前架构类型。
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_profile')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('avatar_url', 'text')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute()

  await db.schema
    .createIndex('idx_user_profile_avatar')
    .on('user_profile')
    .column('avatar_url')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_profile').execute()
}
```

### 程序化迁移器

```typescript
import { Migrator, FileMigrationProvider } from 'kysely'
import { promises as fs } from 'fs'
import * as path from 'path'
// 仅 ESM——CJS 可以直接使用 __dirname
import { fileURLToPath } from 'url'
const migrationFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  './migrations',
)

// `db` 是你的 Kysely<any> 数据库实例
const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder,
  }),
  // 警告：仅在开发中启用。禁用时间戳排序
  // 验证，这可能导致环境之间的架构漂移。
  // allowUnorderedMigrations: true,
})

const { error, results } = await migrator.migrateToLatest()

results?.forEach((it) => {
  if (it.status === 'Success') {
    console.log(`migration "${it.migrationName}" executed successfully`)
  } else if (it.status === 'Error') {
    console.error(`failed to execute migration "${it.migrationName}"`)
  }
})

if (error) {
  console.error('migration failed', error)
  process.exit(1)
}
```

## Django（Python）

### workflow process

```bash
# 从模型更改生成迁移
python manage.py makemigrations

# 应用迁移
python manage.py migrate

# 显示迁移状态
python manage.py showmigrations

# 为自定义 SQL 生成空迁移
python manage.py makemigrations --empty app_name -n description
```

### 数据迁移

```python
from django.db import migrations

def backfill_display_names(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    batch_size = 5000
    users = User.objects.filter(display_name="")
    while users.exists():
        batch = list(users[:batch_size])
        for user in batch:
            user.display_name = user.username
        User.objects.bulk_update(batch, ["display_name"], batch_size=batch_size)

def reverse_backfill(apps, schema_editor):
    pass  # 数据迁移，不需要反向

class Migration(migrations.Migration):
    dependencies = [("accounts", "0015_add_display_name")]

    operations = [
        migrations.RunPython(backfill_display_names, reverse_backfill),
    ]
```

### SeparateDatabaseAndState

从 Django 模型中移除列，但不立即从数据库中删除：

```python
class Migration(migrations.Migration):
    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(model_name="user", name="legacy_field"),
            ],
            database_operations=[],  # 暂时不碰 DB
        ),
    ]
```

## golang-migrate（Go）

### workflow process

```bash
# 创建迁移对
migrate create -ext sql -dir migrations -seq add_user_avatar

# 应用所有待处理的迁移
migrate -path migrations -database "$DATABASE_URL" up

# 回滚最后一个迁移
migrate -path migrations -database "$DATABASE_URL" down 1

# 强制版本（修复脏状态）
migrate -path migrations -database "$DATABASE_URL" force VERSION
```

### 迁移文件

```sql
-- migrations/000003_add_user_avatar.up.sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
CREATE INDEX CONCURRENTLY idx_users_avatar ON users (avatar_url) WHERE avatar_url IS NOT NULL;

-- migrations/000003_add_user_avatar.down.sql
DROP INDEX IF EXISTS idx_users_avatar;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
```

## 零停机迁移策略

对于关键的生产变更，遵循 expand-contract 模式：

```
阶段 1: EXPAND
  - 添加新列/表（可空或带默认值）
  - 部署：应用写入新旧两个
  - 回填现有数据

阶段 2: MIGRATE
  - 部署：应用从新读取，写入新旧两个
  - 验证数据一致性

阶段 3: CONTRACT
  - 部署：应用仅使用新的
  - 在单独的迁移中删除旧列/表
```

### 时间表示例

```
第 1 天：迁移添加 new_status 列（可空）
第 1 天：部署应用 v2 — 写入 status 和 new_status
第 2 天：运行现有行的回填迁移
第 3 天：部署应用 v3 — 仅从 new_status 读取
第 7 天：迁移删除旧 status 列
```

## 反模式

| 反模式 | 为什么失败 | 更好的方法 |
|-------------|-------------|-----------------|
| 在生产中手动 SQL | 无审计跟踪，不可重复 | 始终使用迁移文件 |
| 编辑已部署的迁移 | 导致环境之间漂移 | 创建新迁移代替 |
| 没有默认值的 NOT NULL | 锁定表，重写所有行 | 添加可空，回填，然后添加约束 |
| 在大表上内联索引 | 在构建期间阻止写入 | CREATE INDEX CONCURRENTLY |
| 在一个迁移中混合架构+数据 | 难以回滚，长事务 | 分离迁移 |
| 在移除代码之前删除列 | 应用程序对缺失列出错 | 先移除代码，下次部署再删除列 |
