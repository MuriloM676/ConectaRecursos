export interface SiopEmendaResponse {
  codigoEmenda: string;
  ano: number;
  autor: {
    nome: string;
    partido: string;
    uf: string;
  };
  valorAtual: number;
  objeto: string;
  tipoEmenda: string;
  situacao: string;
  beneficiarios: {
    nome: string;
    cnpj: string;
    valor: number;
  }[];
  impedimentos: {
    codigo: string;
    descricao: string;
    status: string;
  }[];
}
