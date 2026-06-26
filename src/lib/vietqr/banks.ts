/** Danh sách ngân hàng VN + mã BIN Napas (dùng dựng VietQR). */
export interface Bank {
  bin: string;
  short: string; // tên ngắn hiển thị
  name: string; // tên đầy đủ
}

export const BANKS: Bank[] = [
  { bin: "970436", short: "Vietcombank", name: "Ngoại thương Việt Nam (VCB)" },
  { bin: "970415", short: "VietinBank", name: "Công thương Việt Nam (CTG)" },
  { bin: "970418", short: "BIDV", name: "Đầu tư & Phát triển Việt Nam" },
  { bin: "970405", short: "Agribank", name: "Nông nghiệp & PTNT Việt Nam" },
  { bin: "970407", short: "Techcombank", name: "Kỹ thương Việt Nam (TCB)" },
  { bin: "970422", short: "MB Bank", name: "Quân đội (MB)" },
  { bin: "970416", short: "ACB", name: "Á Châu" },
  { bin: "970432", short: "VPBank", name: "Việt Nam Thịnh Vượng" },
  { bin: "970423", short: "TPBank", name: "Tiên Phong" },
  { bin: "970403", short: "Sacombank", name: "Sài Gòn Thương Tín (STB)" },
  { bin: "970437", short: "HDBank", name: "Phát triển TP.HCM" },
  { bin: "970441", short: "VIB", name: "Quốc tế Việt Nam" },
  { bin: "970443", short: "SHB", name: "Sài Gòn – Hà Nội" },
  { bin: "970431", short: "Eximbank", name: "Xuất nhập khẩu Việt Nam" },
  { bin: "970426", short: "MSB", name: "Hàng hải Việt Nam" },
  { bin: "970448", short: "OCB", name: "Phương Đông" },
  { bin: "970440", short: "SeABank", name: "Đông Nam Á" },
  { bin: "970449", short: "LPBank", name: "Lộc Phát Việt Nam (LienVietPostBank)" },
  { bin: "970409", short: "BacABank", name: "Bắc Á" },
  { bin: "970412", short: "PVcomBank", name: "Đại chúng Việt Nam" },
  { bin: "970400", short: "SaigonBank", name: "Sài Gòn Công Thương" },
  { bin: "970428", short: "NamABank", name: "Nam Á" },
  { bin: "970425", short: "ABBANK", name: "An Bình" },
  { bin: "970427", short: "VietABank", name: "Việt Á" },
  { bin: "970433", short: "VietBank", name: "Việt Nam Thương Tín" },
  { bin: "970438", short: "BaoVietBank", name: "Bảo Việt" },
  { bin: "970452", short: "KienLongBank", name: "Kiên Long" },
  { bin: "970430", short: "PGBank", name: "Thịnh vượng & Phát triển" },
  { bin: "970429", short: "SCB", name: "Sài Gòn" },
  { bin: "970454", short: "BVBank", name: "Bản Việt (VietCapitalBank)" },
  { bin: "970419", short: "NCB", name: "Quốc Dân" },
  { bin: "970414", short: "OceanBank", name: "Đại Dương" },
  { bin: "970408", short: "GPBank", name: "Dầu khí Toàn cầu" },
  { bin: "970444", short: "CBBank", name: "Xây dựng Việt Nam" },
  { bin: "970446", short: "Co-opBank", name: "Hợp tác xã Việt Nam" },
  { bin: "970439", short: "PublicBank", name: "Public Bank Việt Nam" },
  { bin: "970434", short: "IndovinaBank", name: "Indovina (IVB)" },
  { bin: "970457", short: "Woori", name: "Woori Việt Nam" },
  { bin: "970424", short: "ShinhanBank", name: "Shinhan Việt Nam" },
  { bin: "970442", short: "HongLeong", name: "Hong Leong Việt Nam" },
  { bin: "970458", short: "UOB", name: "United Overseas Bank Việt Nam" },
  { bin: "422589", short: "CIMB", name: "CIMB Việt Nam" },
  { bin: "546034", short: "CAKE", name: "CAKE by VPBank" },
  { bin: "546035", short: "Ubank", name: "Ubank by VPBank" },
  { bin: "963388", short: "Timo", name: "Timo by BVBank" },
];

const BY_BIN = new Map(BANKS.map((b) => [b.bin, b]));

export function getBankByBin(bin: string | null | undefined): Bank | undefined {
  return bin ? BY_BIN.get(bin) : undefined;
}
