import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ExternalService } from 'src/app/services/external.service';
import { toJpeg } from 'html-to-image';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  @ViewChild('search') searchElement: ElementRef;

  categories: any = [
    {id: 1, name: 'Tracks'},
    {id: 2, name: 'Albums'},
    {id: 3, name: 'Artists'}
  ];

  values: number[] = [1,2,3,4,5,6,7,8,9,10];
  name: string = 'My Ranking';
  textColor: string = '#000000';
  backgroundColor: string = '#5172e8';
  numberOfItems: number = 1;
  categoriaSelecionada: number = 0;
  category: string = 'track';
  number: string = '';
  stringBusca: string = '';
  resultados: any[] = [];
  lista: any[] = [];
  token: any = null;
  formStep: number = 1;
  show: boolean = false;
  selectedItem: number = 0;
  listHasStarted: boolean = false;

  constructor(private externalService: ExternalService) { }

  ngOnInit(): void {
    this.generateSpotifyToken();
    this.generateTemplate();
  }

  generateSpotifyToken() {
    this.externalService.gerarTokenSpotify().subscribe({
      next: (data: any) => {
        this.token = data.token_type + ' ' + data.access_token;
        localStorage.setItem('Authorization', this.token);
      }, 
      error: (error) => {
        console.log(error);
      }
    });
  }

  checkCategoria() {
    switch(this.categoriaSelecionada) {
      case 1:
        this.category = 'track';
        break
      case 2:
        this.category = 'album';
        break
      case 3:
        this.category = 'artist';
        break
      default:
        this.category = 'track';
    }
    this.generateList();
  }

  generateTemplate() {
    if(this.listHasStarted) { 
      // list already has selected elements
      if(this.lista.length > this.numberOfItems) {
        // user went back and decreased the item size
        const diff = this.lista.length - this.numberOfItems;
        for(let i = 0; i < diff; i++) {
          this.lista.pop();
        }
      } else {
        // user went back and increased the item size
        const diff = this.numberOfItems - this.lista.length;
        console.log(this.numberOfItems);
        console.log(this.lista);
        for(let i = 1; i <= diff; i++) {
          this.lista.push({
            id: this.lista[this.lista.length-1].id + 1,
            artist: '',
            name: '',
            img: 'https://placehold.co/80x80?text=Cover'
          });
        }
      }
    } else {
      this.generateList();
    }
    console.log(this.lista);
  }

  generateList() {
    this.lista = new Array(this.numberOfItems);
    for(let i = 0; i < this.numberOfItems; i++) {
      this.lista[i] = {
        id: i + 1,
        artist: '',
        name: '',
        img: 'https://placehold.co/80x80?text=Cover'
      }
    }
  }

  buscar() {
    this.show = true;
    switch(this.categoriaSelecionada) {
      case 1:
        this.getSongs();
        break
      case 2:
        this.getAlbums();
        break
      case 3:
        this.getArtists();
        break
      default:
        this.categoriaSelecionada = 1;
        this.getSongs();
    }
  }

  getSongs() {
    this.externalService.getTracks(this.token, this.stringBusca).subscribe({
      next: (data: any) => {
        console.log(data.tracks.items);
        this.resultados = data.tracks.items ? data.tracks.items : [];
        console.log(this.resultados);
      }, 
      error: (error) => {
        console.log(error);
      }
    })
  }

  getAlbums() {
    this.externalService.getAlbums(this.stringBusca).subscribe({
      next: (data: any) => {
        this.resultados = data.results.albummatches.album;
        console.log(this.resultados);
        this.removeAlbumsWithNoNameOrImage();
      }, 
      error: (error) => {
        console.log(error);
      }
    })
  }

  getArtists() {
    this.externalService.getArtists(this.token, this.stringBusca).subscribe({
      next: (data: any) => {
        this.resultados = data.artists.items;
        console.log(this.resultados);
      }, 
      error: (error) => {
        console.log(error);
      }
    })
  }

  removeAlbumsWithNoNameOrImage() {
    this.resultados = this.resultados.filter((res) => 
      res.name != '(null)' && res.image[2]['#text']
    )

    console.log(this.resultados);
  }

  select(index: number) {
    this.selectedItem = index;
    this.searchElement.nativeElement.focus();
  }

  add(res: any) {
    console.log(res);

    if(this.categoriaSelecionada == 3) {
      this.lista[this.selectedItem] = {
        id: this.selectedItem + 1,
        artist: res.name,
        name: '',
        img: res.images[2].url
      };

    } else if(this.categoriaSelecionada == 2) {
      this.lista[this.selectedItem] = {
        id: this.selectedItem + 1,
        artist: res.artist,
        name: res.name, 
        img: res.image[2]['#text']
      };

    } else {
      this.lista[this.selectedItem] = {
        id: this.selectedItem + 1,
        artist: res.artists[0].name,
        name: res.name, 
        img: res.album.images[1].url
      };
    }
    
    console.log(this.lista);
    this.listHasStarted = true;

  }

  reset() {
    this.name = 'My Ranking';
    this.textColor = '#000000';
    this.backgroundColor = '#5172e8';
    this.category = 'track';
    this.number = '';
    this.formStep = 1;
    this.selectedItem = 0;
    this.listHasStarted = false;
    this.categoriaSelecionada = 0;
    this.numberOfItems = 1;
    this.resultados = [];
    this.show = false;
    this.stringBusca = '';
    this.generateList();
  }

  next() {
    this.formStep = 2;
  }

  back() {
    this.formStep = 1;
  }

  download() {
    const table = document.getElementById('table');
    toJpeg(table, { 
      quality: 0.95
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'ranking.jpg';
      link.href = dataUrl;
      link.click();
      link.remove();
    })
    .catch((error) => {
      console.error('Error downloading image', error);
    });
  }

}
