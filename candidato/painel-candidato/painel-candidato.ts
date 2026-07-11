import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-painel-candidato',
  templateUrl: './painel-candidato.html',
  styleUrls: ['./painel-candidato.css']
})
export class PainelCandidato implements OnInit {
  totalCandidatos: number = 0;
  totalPartidos: number = 0;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Buscar total de candidatos (usando any para evitar erro de tipo)
    this.http.get(`${environment.apiUrl}/candidato/total`)
      .subscribe((resposta: any) => {
        this.totalCandidatos = resposta.total;
        this.cdr.detectChanges();
      }, (erro: any) => {
        console.error('Erro ao buscar total:', erro);
      });

    // Buscar lista de candidatos para contar partidos distintos
    this.http.get(`${environment.apiUrl}/candidato`)
      .subscribe((resposta: any) => {
        // Garantir que resposta é um array
        const lista = Array.isArray(resposta) ? resposta : [];
        const partidosUnicos = new Set(lista.map((c: any) => c.partido));
        this.totalPartidos = partidosUnicos.size;
        console.log('Total de partidos:', this.totalPartidos);
        this.cdr.detectChanges();
      }, (erro: any) => {
        console.error('Erro ao buscar candidatos:', erro);
      });
  }
}
