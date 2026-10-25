export type Product = {
  id: string
  image: string
  width: number
  height: number
  modelCode: string | null
  modelCodeStatus: 'verified' | 'needs-review'
}

export const products: Product[] = [
  { id: 'model-01', image: '/assets/products/processed/07006022-11f1-4466-a1a5-52e852c869df.webp', width: 681, height: 1024, modelCode: '248', modelCodeStatus: 'verified' },
  { id: 'model-02', image: '/assets/products/processed/199b697c-d613-43ad-8dc1-a6792bcc4f3f.webp', width: 681, height: 1024, modelCode: '001', modelCodeStatus: 'verified' },
  { id: 'model-03', image: '/assets/products/processed/3a92adac-e24b-4c4e-b068-ef6c00260713.webp', width: 682, height: 1024, modelCode: '434', modelCodeStatus: 'verified' },
  { id: 'model-04', image: '/assets/products/processed/45a69c3d-0290-489a-bb6f-a294c7053e69.webp', width: 682, height: 1024, modelCode: '40', modelCodeStatus: 'verified' },
  { id: 'model-05', image: '/assets/products/processed/45b72b33-2fb4-4a19-a719-dbac9044de88.webp', width: 681, height: 1024, modelCode: '120', modelCodeStatus: 'verified' },
  { id: 'model-06', image: '/assets/products/processed/5df0e99c-81eb-40ff-8605-45110d16087e.webp', width: 682, height: 1024, modelCode: null, modelCodeStatus: 'needs-review' },
  { id: 'model-07', image: '/assets/products/processed/71a06bef-d53b-4a7c-9327-52c7565b267f.webp', width: 682, height: 1024, modelCode: '9205', modelCodeStatus: 'verified' },
  { id: 'model-08', image: '/assets/products/processed/739b9df9-05a7-4cab-8074-9e388f5bac4e.webp', width: 682, height: 1024, modelCode: '531', modelCodeStatus: 'verified' },
  { id: 'model-09', image: '/assets/products/processed/75c54aa7-83dc-4966-a0aa-6c57ead23e30.webp', width: 681, height: 1024, modelCode: '570', modelCodeStatus: 'verified' },
  { id: 'model-10', image: '/assets/products/processed/86f89b68-5077-4c9e-9594-02319dbaef15.webp', width: 683, height: 1024, modelCode: '537', modelCodeStatus: 'verified' },
  { id: 'model-11', image: '/assets/products/processed/8dcd6b06-7760-4f8c-bc2c-78a473130d58.webp', width: 682, height: 1024, modelCode: '550', modelCodeStatus: 'verified' },
  { id: 'model-12', image: '/assets/products/processed/92205907-4086-4476-8611-6789c79721e7.webp', width: 681, height: 1024, modelCode: '777', modelCodeStatus: 'verified' },
  { id: 'model-13', image: '/assets/products/processed/93cfdc73-7cb2-4933-8c0c-d85f5a85c91b.webp', width: 682, height: 1024, modelCode: '9186', modelCodeStatus: 'verified' },
  { id: 'model-14', image: '/assets/products/processed/b2bb0279-6c2a-41dc-97fc-710b641e0591.webp', width: 448, height: 1024, modelCode: '925', modelCodeStatus: 'verified' },
  { id: 'model-15', image: '/assets/products/processed/c6680890-a97a-449b-be91-ed82cac7543b.webp', width: 682, height: 1024, modelCode: '90', modelCodeStatus: 'verified' },
  { id: 'model-16', image: '/assets/products/processed/cf11d442-a6b3-46ec-8f47-932e39865353.webp', width: 681, height: 1024, modelCode: '381', modelCodeStatus: 'verified' },
]