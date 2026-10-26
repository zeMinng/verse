/** 图标和图片的类型 */
export type IconMode = string | { light: string; dark: string }
/** 尺寸类型 */
export type SizeType = null | string | number
/** 链接类型 */
export type LinkType = string | undefined
/** Rel 属性类型 */
export type RelType = string | undefined
/** 目标类型 */
export type TargetType = string | undefined

export type IconType =
  | string
  | { icon: string; color?: IconMode }
  | { light: string; dark: string; color?: IconMode }
  | { svg: IconMode }

export type ImageType =
  | string
  | { src: string; crop?: boolean; [prop: string]: any }
  | { light: string; dark: string; crop?: boolean; [prop: string]: any }

export interface LinkItem {
  /** 名称 */
  name: string
  /** 描述 */
  desc?: string
  /** 链接 */
  link?: LinkType
  /** 链接地址描述文本 */
  linkText?: string
  /** Rel 属性 */
  rel?: RelType
  /** 链接的目标 */
  target?: TargetType
  /** 图标配置 */
  icon?: IconType
  /** 图片配置 */
  image?: ImageType
  /** 图片和图标大小 @default '32' */
  size?: SizeType
}
