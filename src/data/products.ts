export type Product = {
  id: string
  image: string
  width: number
  height: number
  modelCode: string | null
  modelCodeStatus: 'verified' | 'needs-review'
  category: 'abaya' | 'isdaal'
}

const existingProducts: Product[] = [
  { id: 'model-01', image: '/assets/products/processed/07006022-11f1-4466-a1a5-52e852c869df.webp', width: 681, height: 1024, modelCode: '248', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-02', image: '/assets/products/processed/199b697c-d613-43ad-8dc1-a6792bcc4f3f.webp', width: 681, height: 1024, modelCode: '001', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-03', image: '/assets/products/processed/3a92adac-e24b-4c4e-b068-ef6c00260713.webp', width: 682, height: 1024, modelCode: '434', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-04', image: '/assets/products/processed/45a69c3d-0290-489a-bb6f-a294c7053e69.webp', width: 682, height: 1024, modelCode: '40', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-05', image: '/assets/products/processed/45b72b33-2fb4-4a19-a719-dbac9044de88.webp', width: 681, height: 1024, modelCode: '120', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-06', image: '/assets/products/processed/5df0e99c-81eb-40ff-8605-45110d16087e.webp', width: 682, height: 1024, modelCode: '9205', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-07', image: '/assets/products/processed/71a06bef-d53b-4a7c-9327-52c7565b267f.webp', width: 682, height: 1024, modelCode: '531', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-08', image: '/assets/products/processed/739b9df9-05a7-4cab-8074-9e388f5bac4e.webp', width: 682, height: 1024, modelCode: '80', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-09', image: '/assets/products/processed/75c54aa7-83dc-4966-a0aa-6c57ead23e30.webp', width: 681, height: 1024, modelCode: '570', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-10', image: '/assets/products/processed/86f89b68-5077-4c9e-9594-02319dbaef15.webp', width: 683, height: 1024, modelCode: '537', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-11', image: '/assets/products/processed/8dcd6b06-7760-4f8c-bc2c-78a473130d58.webp', width: 682, height: 1024, modelCode: '550', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-12', image: '/assets/products/processed/92205907-4086-4476-8611-6789c79721e7.webp', width: 681, height: 1024, modelCode: '777', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-13', image: '/assets/products/processed/93cfdc73-7cb2-4933-8c0c-d85f5a85c91b.webp', width: 682, height: 1024, modelCode: '9186', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-14', image: '/assets/products/processed/b2bb0279-6c2a-41dc-97fc-710b641e0591.webp', width: 448, height: 1024, modelCode: '925', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-15', image: '/assets/products/processed/c6680890-a97a-449b-be91-ed82cac7543b.webp', width: 682, height: 1024, modelCode: '90', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'model-16', image: '/assets/products/processed/cf11d442-a6b3-46ec-8f47-932e39865353.webp', width: 681, height: 1024, modelCode: '381', modelCodeStatus: 'verified', category: 'abaya' },
]

const telegramProducts: Product[] = [
  { id: 'telegram-model-201', image: '/assets/products/processed/telegram-model-201.webp', width: 532, height: 800, modelCode: '201', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-200', image: '/assets/products/processed/telegram-model-200.webp', width: 532, height: 800, modelCode: '200', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-199', image: '/assets/products/processed/telegram-model-199.webp', width: 532, height: 800, modelCode: '199', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-307', image: '/assets/products/processed/telegram-model-307.webp', width: 535, height: 800, modelCode: '307', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-203', image: '/assets/products/processed/telegram-model-203.webp', width: 532, height: 800, modelCode: '203', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-202', image: '/assets/products/processed/telegram-model-202.webp', width: 532, height: 800, modelCode: '202', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-461', image: '/assets/products/processed/telegram-model-461.webp', width: 532, height: 800, modelCode: '461', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-254', image: '/assets/products/processed/telegram-model-254.webp', width: 533, height: 800, modelCode: '254', modelCodeStatus: 'verified', category: 'isdaal' },
  { id: 'telegram-model-0278', image: '/assets/products/processed/telegram-model-0278.webp', width: 243, height: 605, modelCode: '0278', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-405', image: '/assets/products/processed/telegram-model-405.webp', width: 449, height: 769, modelCode: '405', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-330', image: '/assets/products/processed/telegram-model-330.webp', width: 307, height: 727, modelCode: '330', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-111', image: '/assets/products/processed/telegram-model-111.webp', width: 370, height: 722, modelCode: '111', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-184', image: '/assets/products/processed/telegram-model-184.webp', width: 290, height: 787, modelCode: '184', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-161', image: '/assets/products/processed/telegram-model-161.webp', width: 323, height: 757, modelCode: '161', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-409', image: '/assets/products/processed/telegram-model-409.webp', width: 600, height: 799, modelCode: '409', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-306', image: '/assets/products/processed/telegram-model-306.webp', width: 382, height: 757, modelCode: '306', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-168', image: '/assets/products/processed/telegram-model-168.webp', width: 475, height: 628, modelCode: '168', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-101', image: '/assets/products/processed/telegram-model-101.webp', width: 275, height: 769, modelCode: '101', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-103', image: '/assets/products/processed/telegram-model-103.webp', width: 341, height: 767, modelCode: '103', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-406', image: '/assets/products/processed/telegram-model-406.webp', width: 436, height: 787, modelCode: '406', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-050', image: '/assets/products/processed/telegram-model-050.webp', width: 352, height: 737, modelCode: '050', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-030', image: '/assets/products/processed/telegram-model-030.webp', width: 413, height: 739, modelCode: '030', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-010', image: '/assets/products/processed/telegram-model-010.webp', width: 438, height: 784, modelCode: '010', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-09', image: '/assets/products/processed/telegram-model-09.webp', width: 534, height: 782, modelCode: '09', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-375', image: '/assets/products/processed/telegram-model-375.webp', width: 415, height: 787, modelCode: '375', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-340', image: '/assets/products/processed/telegram-model-340.webp', width: 278, height: 777, modelCode: '340', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-335', image: '/assets/products/processed/telegram-model-335.webp', width: 321, height: 762, modelCode: '335', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-320', image: '/assets/products/processed/telegram-model-320.webp', width: 417, height: 789, modelCode: '320', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-220', image: '/assets/products/processed/telegram-model-220.webp', width: 469, height: 683, modelCode: '220', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-226', image: '/assets/products/processed/telegram-model-226.webp', width: 521, height: 737, modelCode: '226', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-208', image: '/assets/products/processed/telegram-model-208.webp', width: 391, height: 769, modelCode: '208', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-204', image: '/assets/products/processed/telegram-model-204.webp', width: 300, height: 694, modelCode: '204', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-260', image: '/assets/products/processed/telegram-model-260.webp', width: 533, height: 782, modelCode: '260', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-255', image: '/assets/products/processed/telegram-model-255.webp', width: 386, height: 703, modelCode: '255', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-222', image: '/assets/products/processed/telegram-model-222.webp', width: 393, height: 683, modelCode: '222', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-3002', image: '/assets/products/processed/telegram-model-3002.webp', width: 477, height: 770, modelCode: '3002', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-1490', image: '/assets/products/processed/telegram-model-1490.webp', width: 436, height: 785, modelCode: '1490', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-350', image: '/assets/products/processed/telegram-model-350.webp', width: 344, height: 691, modelCode: '350', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-1498', image: '/assets/products/processed/telegram-model-1498.webp', width: 314, height: 780, modelCode: '1498', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-1487', image: '/assets/products/processed/telegram-model-1487.webp', width: 405, height: 689, modelCode: '1487', modelCodeStatus: 'verified', category: 'isdaal' },
  { id: 'telegram-model-1457', image: '/assets/products/processed/telegram-model-1457.webp', width: 480, height: 784, modelCode: '1457', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-104', image: '/assets/products/processed/telegram-model-104.webp', width: 359, height: 767, modelCode: '104', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-310', image: '/assets/products/processed/telegram-model-310.webp', width: 271, height: 774, modelCode: '310', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-308', image: '/assets/products/processed/telegram-model-308.webp', width: 287, height: 770, modelCode: '308', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-309', image: '/assets/products/processed/telegram-model-309.webp', width: 281, height: 762, modelCode: '309', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-305', image: '/assets/products/processed/telegram-model-305.webp', width: 321, height: 762, modelCode: '305', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-301', image: '/assets/products/processed/telegram-model-301.webp', width: 371, height: 737, modelCode: '301', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-196', image: '/assets/products/processed/telegram-model-196.webp', width: 483, height: 774, modelCode: '196', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-192', image: '/assets/products/processed/telegram-model-192.webp', width: 302, height: 764, modelCode: '192', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-195', image: '/assets/products/processed/telegram-model-195.webp', width: 430, height: 777, modelCode: '195', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-650', image: '/assets/products/processed/telegram-model-650.webp', width: 337, height: 800, modelCode: '650', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-999', image: '/assets/products/processed/telegram-model-999.webp', width: 450, height: 678, modelCode: '999', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-711', image: '/assets/products/processed/telegram-model-711.webp', width: 413, height: 679, modelCode: '711', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-266', image: '/assets/products/processed/telegram-model-266.webp', width: 337, height: 789, modelCode: '266', modelCodeStatus: 'verified', category: 'abaya' },
  { id: 'telegram-model-447', image: '/assets/products/processed/telegram-model-447.webp', width: 288, height: 679, modelCode: '447', modelCodeStatus: 'verified', category: 'abaya' },
]

export const products: Product[] = [...telegramProducts, ...existingProducts]