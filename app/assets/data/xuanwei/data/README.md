# 玄微资料层

这里保存可审阅的 YAML 参考资料。机器可读的文件清单、15 个发布模块、数量和覆盖范围见上级目录的 `DATA_MANIFEST.yaml`。

## 约定

- YAML 只描述资料，不直接决定页面文案；页面计算由 `app/engine/knowledge/` 负责。
- `records` 统计文件的主要业务条目；复合文件的分项数量以清单中的 `breakdown` 为准。
- `complete` 表示当前发布版本声明的数据集范围已经 100% 完整。
- 数据集必须使用明确版本与边界，例如“观音灵签精选集 v1（20 支）”；不能把精选集描述成全部历史语料。
- `source` 是资料来源或整理口径；未提供版本号的条目不应当作现代科学数据。
- 新增或修改 YAML 后必须同步更新 `DATA_MANIFEST.yaml`，并运行 `bun test tests/xuanwei-data.test.ts`。
- 新增发布模块时必须同步登记 `modules`；测试要求发布模块覆盖率始终为 100%。

## 当前文件

| 文件 | 系统 | 覆盖范围 |
| --- | --- | --- |
| `bazi-nayin.yaml` | 八字 | 60 个干支条目、30 个纳音对 |
| `chenggu-data.yaml` | 称骨 | 年/月/日/时权重与 46 条歌诀 |
| `dream-data.yaml` | 解梦 | 38 个关键词 |
| `fengshui-data.yaml` | 风水 | 八宅方位与命卦表 |
| `iching-hexagrams.yaml` | 易经 | 64 卦 |
| `lots-data.yaml` | 抽签 | 20 支观音灵签 |
| `nameology-data.yaml` | 姓名学 | 数理与三才配置 |
| `shuowen*.yaml` | 说文 | 224 个扩展字符、181 个部首、111 个常用字参考条目 |
| `tarot-cards.yaml` | 塔罗 | 78 张牌与牌阵 |
