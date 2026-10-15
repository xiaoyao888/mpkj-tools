import {
  BookOutlined,
  CalculatorOutlined,
  DollarOutlined,
  EditOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FontSizeOutlined,
  GroupOutlined,
  KeyOutlined,
  PlusCircleOutlined,
  BlockOutlined,
  FileTextOutlined,
  HighlightOutlined,
  SmileOutlined
} from '@ant-design/icons-vue';

/**
 * 全站菜单分类配置：顶部菜单与首页共用
 * key 为分类标识，title 为分类名称，icon 为分类图标
 * children 中的 path 需与路由 path 保持一致
 */
export const MENU_GROUPS = [
  {
    key: 'finance',
    title: '财税计算',
    icon: CalculatorOutlined,
    children: [
      { path: '/rateCalc', name: '小微企业税负计算器', desc: '小微企业税负率快速计算' },
      { path: '/rmbConverter', name: '人民币大写转换器', desc: '数字转人民币大写金额' }
    ]
  },
  {
    key: 'text',
    title: '文本处理',
    icon: FontSizeOutlined,
    children: [
      { path: '/daxiaoxie', name: '字母大小写转化', desc: '英文大小写与命名格式转换' },
      { path: '/chineseToPinyin', name: '汉字批量转拼音', desc: '汉字批量转换为拼音' }
    ]
  },
  {
    key: 'image-file',
    title: '图片与文件',
    icon: FileImageOutlined,
    children: [
      { path: '/imageToPdf', name: '图片合并PDF', desc: '多张图片合并为 PDF' },
      { path: '/wordToPdf', name: 'Word导出PDF', desc: 'Word 文档导出为 PDF' },
      { path: '/watermark', name: '图片加水印', desc: '批量添加文字水印' },
      { path: '/fileToBase64', name: '文件转Base64', desc: '文件转 Base64 编码' }
    ]
  },
  {
    key: 'security',
    title: '安全加密',
    icon: KeyOutlined,
    children: [{ path: '/pwdGen', name: '密码生成器', desc: '随机生成高强度密码' }]
  },
  {
    key: 'education',
    title: '学习教育',
    icon: BookOutlined,
    children: [
      { path: '/mathGen', name: '一年级数学练习', desc: '一年级数学口算题生成' },
      { path: '/chineseGen', name: '一年级语文练习', desc: '一年级语文练习生成' }
    ]
  },
  {
    key: 'entertainment',
    title: '休闲娱乐',
    icon: SmileOutlined,
    children: [{ path: '/gobang', name: '五子棋游戏', desc: '人机对战五子棋小游戏' }]
  }
];

// 工具图标映射，供首页卡片使用
export const TOOL_ICONS = {
  '/rateCalc': CalculatorOutlined,
  '/pwdGen': KeyOutlined,
  '/rmbConverter': DollarOutlined,
  '/daxiaoxie': FontSizeOutlined,
  '/chineseToPinyin': EditOutlined,
  '/gobang': BlockOutlined,
  '/fileToBase64': FileTextOutlined,
  '/mathGen': PlusCircleOutlined,
  '/chineseGen': BookOutlined,
  '/imageToPdf': FilePdfOutlined,
  '/wordToPdf': FileWordOutlined,
  '/watermark': HighlightOutlined
};
