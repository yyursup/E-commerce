const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'SellerRegister.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const newFormContent = `              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* 1. HỒ SƠ SHOP */}
                <div className="space-y-5">
                  <h3 className={cn("text-lg font-semibold border-b pb-2", isDark ? "text-white border-slate-700" : "text-stone-900 border-stone-200")}>1. Hồ sơ shop</h3>
                  
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Tên shop</label>
                      <div className="relative">
                        <HiOutlineUser className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="text"
                          placeholder="VD: TechZone Official"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60', isDark ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20' : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20', errors.shopName && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20')}
                          {...register('shopName', { required: 'Vui lòng nhập tên shop', maxLength: { value: 150, message: 'Tối đa 150 ký tự' } })}
                        />
                      </div>
                      {errors.shopName && <p className="mt-1.5 text-sm text-red-500">{errors.shopName.message}</p>}
                    </div>

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Ảnh bìa (URL)</label>
                      <div className="relative">
                        <HiOutlinePhotograph className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="url"
                          placeholder="https://..."
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60', isDark ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20' : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20', errors.coverImageUrl && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20')}
                          {...register('coverImageUrl', { maxLength: { value: 255, message: 'Tối đa 255 ký tự' } })}
                        />
                      </div>
                      {errors.coverImageUrl && <p className="mt-1.5 text-sm text-red-500">{errors.coverImageUrl.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Mô tả shop</label>
                    <div className="relative">
                      <HiOutlineDocumentText className={cn('absolute left-3 top-3 h-5 w-5', isDark ? 'text-slate-500' : 'text-stone-400')} />
                      <textarea
                        rows={3}
                        placeholder="Giới thiệu ngắn về shop..."
                        className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60', isDark ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20' : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20', errors.description && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20')}
                        {...register('description', { maxLength: { value: 5000, message: 'Tối đa 5000 ký tự' } })}
                      />
                    </div>
                    {errors.description && <p className="mt-1.5 text-sm text-red-500">{errors.description.message}</p>}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Số điện thoại shop</label>
                      <div className="relative">
                        <HiOutlinePhone className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="tel"
                          placeholder="0912345678"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60', isDark ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20' : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20', errors.shopPhone && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20')}
                          {...register('shopPhone', { required: 'Vui lòng nhập số điện thoại', maxLength: { value: 20, message: 'Tối đa 20 ký tự' } })}
                        />
                      </div>
                      {errors.shopPhone && <p className="mt-1.5 text-sm text-red-500">{errors.shopPhone.message}</p>}
                    </div>

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Email shop</label>
                      <div className="relative">
                        <HiOutlineMail className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="email"
                          placeholder="shop@example.com"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition placeholder:opacity-60', isDark ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20' : 'border-stone-300 bg-stone-50/80 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20', errors.shopEmail && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20')}
                          {...register('shopEmail', { maxLength: { value: 120, message: 'Tối đa 120 ký tự' }, pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i, message: 'Email không hợp lệ' } })}
                        />
                      </div>
                      {errors.shopEmail && <p className="mt-1.5 text-sm text-red-500">{errors.shopEmail.message}</p>}
                    </div>
                  </div>
                </div>

                {/* 2. THÔNG TIN DOANH NGHIỆP */}
                {sellerType === 'BUSINESS' && (
                  <div className="space-y-5">
                    <h3 className={cn("text-lg font-semibold border-b pb-2", isDark ? "text-white border-slate-700" : "text-stone-900 border-stone-200")}>2. Thông tin doanh nghiệp</h3>
                    
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Loại hình kinh doanh</label>
                        <div className="relative">
                          <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                          <select
                            className={cn('w-full appearance-none rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white focus:border-amber-500/60' : 'border-stone-300 bg-stone-50/80 text-stone-900 focus:border-amber-500', errors.businessType && 'border-red-500/70')}
                            {...register('businessType', { required: 'Vui lòng chọn loại hình kinh doanh' })}
                          >
                            <option value="">-- Chọn loại hình --</option>
                            <option value="HOUSEHOLD">Hộ kinh doanh</option>
                            <option value="ENTERPRISE">Doanh nghiệp</option>
                          </select>
                        </div>
                        {errors.businessType && <p className="mt-1.5 text-sm text-red-500">{errors.businessType.message}</p>}
                      </div>

                      <div>
                        <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Tên công ty / Hộ kinh doanh</label>
                        <div className="relative">
                          <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                          <input
                            type="text"
                            placeholder="Nhập tên đăng ký kinh doanh"
                            className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.businessName && 'border-red-500/70')}
                            {...register('businessName', { required: 'Vui lòng nhập tên công ty/HKD' })}
                          />
                        </div>
                        {errors.businessName && <p className="mt-1.5 text-sm text-red-500">{errors.businessName.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Địa chỉ trụ sở</label>
                      <div className="relative">
                        <HiOutlineLocationMarker className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="text"
                          placeholder="Địa chỉ ghi trên Giấy phép kinh doanh"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.businessAddress && 'border-red-500/70')}
                          {...register('businessAddress', { required: 'Vui lòng nhập địa chỉ trụ sở' })}
                        />
                      </div>
                      {errors.businessAddress && <p className="mt-1.5 text-sm text-red-500">{errors.businessAddress.message}</p>}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Mã số thuế</label>
                        <div className="relative">
                          <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                          <input
                            type="text"
                            placeholder="Mã số thuế doanh nghiệp"
                            className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.taxCode && 'border-red-500/70')}
                            {...register('taxCode', { required: 'Vui lòng nhập mã số thuế' })}
                          />
                        </div>
                        {errors.taxCode && <p className="mt-1.5 text-sm text-red-500">{errors.taxCode.message}</p>}
                      </div>

                      <div>
                        <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Ảnh Giấy phép kinh doanh (URL)</label>
                        <div className="relative">
                          <HiOutlinePhotograph className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                          <input
                            type="url"
                            placeholder="https://..."
                            className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.businessLicenseUrl && 'border-red-500/70')}
                            {...register('businessLicenseUrl', { required: 'Vui lòng cung cấp link ảnh GPKD' })}
                          />
                        </div>
                        {errors.businessLicenseUrl && <p className="mt-1.5 text-sm text-red-500">{errors.businessLicenseUrl.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. LẤY/TRẢ HÀNG & PHÁP LÝ */}
                <div className="space-y-5">
                  <h3 className={cn("text-lg font-semibold border-b pb-2", isDark ? "text-white border-slate-700" : "text-stone-900 border-stone-200")}>
                    {sellerType === 'BUSINESS' ? '3. Lấy/trả hàng & Hóa đơn' : '2. Lấy/trả hàng & Pháp lý'}
                  </h3>
                  
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Địa chỉ lấy hàng</label>
                      <div className="relative">
                        <HiOutlineLocationMarker className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="text"
                          placeholder="Nhập địa chỉ lấy hàng"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.pickupAddress && 'border-red-500/70')}
                          {...register('pickupAddress', { required: 'Vui lòng nhập địa chỉ lấy hàng' })}
                        />
                      </div>
                      {errors.pickupAddress && <p className="mt-1.5 text-sm text-red-500">{errors.pickupAddress.message}</p>}
                    </div>

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Địa chỉ trả hàng</label>
                      <div className="relative">
                        <HiOutlineLocationMarker className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="text"
                          placeholder="Nhập địa chỉ nhận hàng hoàn trả"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.returnAddress && 'border-red-500/70')}
                          {...register('returnAddress', { required: 'Vui lòng nhập địa chỉ trả hàng' })}
                        />
                      </div>
                      {errors.returnAddress && <p className="mt-1.5 text-sm text-red-500">{errors.returnAddress.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {sellerType === 'INDIVIDUAL' && (
                      <div>
                        <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Mã số thuế cá nhân</label>
                        <div className="relative">
                          <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                          <input
                            type="text"
                            placeholder="Mã số thuế cá nhân"
                            className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.taxCode && 'border-red-500/70')}
                            {...register('taxCode', { required: 'Vui lòng nhập mã số thuế' })}
                          />
                        </div>
                        {errors.taxCode && <p className="mt-1.5 text-sm text-red-500">{errors.taxCode.message}</p>}
                      </div>
                    )}

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Email nhận hóa đơn</label>
                      <div className="relative">
                        <HiOutlineMail className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="email"
                          placeholder="email.hoadon@example.com"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900')}
                          {...register('invoiceEmail')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. THÔNG TIN NGÂN HÀNG */}
                <div className="space-y-5">
                  <h3 className={cn("text-lg font-semibold border-b pb-2", isDark ? "text-white border-slate-700" : "text-stone-900 border-stone-200")}>
                    {sellerType === 'BUSINESS' ? '4. Thông tin ngân hàng' : '3. Thông tin ngân hàng'}
                  </h3>
                  
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Tên ngân hàng</label>
                      <div className="relative">
                        <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="text"
                          placeholder="VD: Vietcombank, Techcombank..."
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.bankName && 'border-red-500/70')}
                          {...register('bankName', { required: 'Vui lòng nhập tên ngân hàng' })}
                        />
                      </div>
                      {errors.bankName && <p className="mt-1.5 text-sm text-red-500">{errors.bankName.message}</p>}
                    </div>

                    <div>
                      <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Tên chủ tài khoản</label>
                      <div className="relative">
                        <HiOutlineUser className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                        <input
                          type="text"
                          placeholder="NGUYEN VAN A"
                          className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.bankAccountName && 'border-red-500/70')}
                          {...register('bankAccountName', { required: 'Vui lòng nhập tên chủ tài khoản' })}
                        />
                      </div>
                      {errors.bankAccountName && <p className="mt-1.5 text-sm text-red-500">{errors.bankAccountName.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-stone-700')}>Số tài khoản</label>
                    <div className="relative">
                      <HiOutlineDocumentText className={cn('absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-stone-400')} />
                      <input
                        type="text"
                        placeholder="Nhập số tài khoản"
                        className={cn('w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition', isDark ? 'border-slate-600 bg-slate-800/50 text-white' : 'border-stone-300 bg-stone-50/80 text-stone-900', errors.bankAccountNumber && 'border-red-500/70')}
                        {...register('bankAccountNumber', { required: 'Vui lòng nhập số tài khoản' })}
                      />
                    </div>
                    {errors.bankAccountNumber && <p className="mt-1.5 text-sm text-red-500">{errors.bankAccountNumber.message}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-slate-700">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition',
                      isSubmitting
                        ? 'cursor-not-allowed bg-amber-500/60'
                        : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.99]',
                    )}
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                  </button>
                </div>
              </form>`;

const startStr = '<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">';
const endStr = '</form>';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newFormContent + content.substring(endIndex);
  fs.writeFileSync(filePath, content);
  console.log("Form replaced successfully!");
} else {
  console.log("Could not find form boundaries.");
}
